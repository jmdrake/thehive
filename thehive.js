var userid = localStorage.getItem("userid");
var user = JSON.parse(localStorage.getItem("user"));

var colonyid = undefined;

var clouddb = "https://projecthive.iriscouch.com/";

var users = new PouchDB("hiveusers");
var remusers = new PouchDB(clouddb + "hiveusers");

var colonies = new PouchDB("hivecolonies");
var remcolonies = new PouchDB(clouddb + "hivecolonies");

var hives = new PouchDB("hivehives");
var remhives = new PouchDB(clouddb + "hivehives")

var families = new PouchDB("hivefamilies");
var remfamilies = new PouchDB(clouddb + "hivefamilies");

var currency = "$0,0.00";

var userddoc = {
    _id : "_design/my_index",
    views : {
        by_family : {
            map: function (doc) { emit(doc.family); }.toString()
        }
    }
}

remusers.put(userddoc);

remusers.query('my_index/by_family', {limit:0});

var familyddoc = {
    _id : "_design/my_index",
    views : {
        by_colony : {
            map: function (doc) { emit(doc.colony); }.toString()
        }
    }
}

remfamilies.put(familyddoc);

remfamilies.query('my_index/by_colony', {limit:0});

var colonyddoc = {
    _id : "_design/my_index",
    views : {
        by_hive : {
            map: function (doc) { emit(doc.hive); }.toString()
        }
    }
}

remcolonies.put(colonyddoc);

remcolonies.query('my_index/by_hive', {limit:0});


function main(){
    // If not logged in, redirect to login / register page
    if(user == undefined)
        window.location.replace("user.html");
        
    // Set the user name on the welcome screen
    $("#userinfo").html(user.fname);
    
    // Load local data
    if(user.family != undefined) {
        updatefamilyinfo(user.family);
        localStorage.setItem("familyid", user.family);
    } else {
        setfamilyform(user.family)
    }   
        
    // Sync cloud data
    families.sync(clouddb + "hivefamilies").on('complete', function(info){
        var family = JSON.parse(localStorage.getItem("family"));
        if(family != null) updatefamilyinfo(family._id);
        colonies.sync(clouddb + "hivecolonies").on('complete', function(info){
            var colony = JSON.parse(localStorage.getItem("colony"));
            if(colony != null) updatecolonyinfo(colony._id);
            hives.sync(clouddb + "hivehives").on('complete', function(info){
                var hive = JSON.parse(localStorage.getItem("hive"))
                if(hive != null) updatehiveinfo(hive._id);
            })
        })
    }) 
}

// Controller functions:
// addfamily()
// joinfamiy()
// addcolony()
// joincolony()
// addhive()
// joinhive()

function addfamily(){
    // familyid to userdoc then update family information
    var newfamily = {
        _id : $("#familyid").val(),
        name : $("#familyname").val(),
        manager : userid,
        networth : user.networth
    };
    
    remfamilies.put(newfamily).then(function(res){
        remusers.get(userid).then(function(userdoc){
            userdoc.family = newfamily._id;
            remusers.put(userdoc).then(function(res){
                user = userdoc;
                localStorage.setItem("user", JSON.stringify(user));
                updatefamilyinfo(newfamily._id);
                setcolonyform(newfamily._id);
            })
        })
    }).catch(function(err) {
        if(err.status="409") {
            alert("Error adding family.  Family with ID " + newfamily._id + " already exixsts.");
            console.log("Error adding family : " + err)
        } else {
            alert("Error adding family " + err);
            console.log("Error adding family : " + err)
        }
    })
}

function joinfamily(){
    // add familyid to userdoc then update family information
    var familyid = $("#familyselect").val();
    remusers.get(userid).then(function(userdoc){
        userdoc.family = familyid;
        user = userdoc;
        localStorage.setItem("user", JSON.stringify(user));
        remusers.put(userdoc).then(function(res){
            families.get(familyid).then(function(familydoc) {
                updatefamilyinfo(familyid)
            });
        })
    }).catch(function(err){
        console.log("Error joining family : " + err);
    })
}

function addcolony(){
    var familyid = $("#familyid").val();
    var colonyid = $("#colonyid").val();
    
    remfamilies.get(familyid).then(function(familydoc){
        var newcolony = {
            _id : colonyid,
            name : $("#colonyname").val(),
            manager : userid,
            networth : familydoc.networth
        };
        remcolonies.put(newcolony).then(function(res){
            familydoc.colony = newcolony._id;
            remfamilies.put(familydoc).then(function(res){
                updatecolonyinfo(newcolony._id);
                sethiveform(newcolony._id)
            }).catch(function(err){console.log("Add Colony Err 1 : " + err)})
        }).catch(function(err){console.log("Add Colony Err 2 : " + err)})
    }).catch(function(err){console.log("Add Colony Err 3 " + err)})
}

function joincolony(){
    var colonyid = $("#colonyselect").val();
    var familyid = $("#familyid").val();
    families.get(familyid).then(function(familydoc){
        familydoc.colony = colonyid;
        families.put(familydoc).then(function(res){
            colonies.get(colonyid).then(function(colonydoc){
                updatecolonyinfo(colonyid)
            })
        });
    }).catch(function(err){
        console.log("Error joining colony : " + err)
    })
}

function addhive(){
    var colonyid = $("#colonyid").val();
    remcolonies.get(colonyid).then(function(colonydoc){
        var newhive = {
            _id : $("#hiveid").val(),
            name : $("#hivename").val(),
            manager : userid,
            networth : colonydoc.networth
        };
        remhives.put(newhive).then(function(res){
            colonydoc.hive = newhive._id;
            remcolonies.put(colonydoc).then(function(res){
                updatehiveinfo(newhive._id);
            }).catch(function(err){console.log("Add Hive Err 1 : " + err)})
        }).catch(function(err){console.log("Add Hive Err 2 : " + err)})
    }).catch(function(err){console.log("Add Hive Err 3 : " + err)})
}


function joinhive(){
    var hiveid = $("#hiveselect").val();
    var colonyid = $("#colonyid").val();
    remcolonies.get(colonyid).then(function(colonydoc){
        colonydoc.hive = hiveid;
        remcolonies.put(colonydoc).then(function(res) {
            updatehiveinfo(hiveid)
        });
    })
}

// View functions:
// updatefamilyinfo()
// updatecolonyinfo()
// updatehiveinfo()
// sethiveform()
// setcolonyform()
// newcollapsible()
// newform()
// newsubmit()
// newtextfield()
// newselect()

function fullname(doc)
{
    return doc.fname + " " + doc.lname;
}

function updatefamilyinfo(familyid){
    remfamilies.get(familyid).then(function(familydoc){
        // Display header
        $("#familyinfo").html("<h1>Family Information</h1><div>Family : " + familydoc.name + "</div>");
        
        // Display family manager
        remusers.get(familydoc.manager).then(function(userdoc){
            $("#familyinfo").append("<div>Manager: " + fullname(userdoc) + "</div>")
        })
        
        // Display family members
        $("#familyinfo").append("<div>Members In Family <ul id='memberlist'></ul></div>");
        remusers.query("my_index/by_family", {
            key : familyid, 
            include_docs : true
        }).then(function(result){
            var networth = 0;
            for(var i=0; i < result.rows.length; i++) {
                $("#memberlist").append("<li>" + result.rows[i].doc.fname + " " + result.rows[i].doc.lname +
                ":" + numeral(result.rows[i].doc.networth).format(currency) + "</li>");
                networth += parseFloat(result.rows[i].doc.networth);
            }
            $("#familyinfo").append("<div>Total Networth: " + numeral(networth).format(currency));
            if(networth != familydoc.networth) {
                familydoc.networth = networth;
                remfamilies.put(familydoc).catch(function(err){console.log("Error updating family info : " + err)});
            } 
        });
        if(familydoc.colony != undefined) {
            updatecolonyinfo(familydoc.colony);
        } else {
            setcolonyform(familyid)
        }
    }).catch(function(err){console.log("Error updating family info 2 : " + err + JSON.stringify(familyid))});
}

function updatecolonyinfo(colonyid){
    remcolonies.get(colonyid).then(function(colonydoc){
        // Display header
        $("#colonyinfo").html("<h1>Colony Information</h1><div>Colony : " + colonydoc.name + "</div>");
        
        // Display colony manager
        remusers.get(colonydoc.manager).then(function(userdoc){
            $("#colonyinfo").append("<div>Manager: " + fullname(userdoc) + "</div>")
        })
        
        // Display families
        $("#colonyinfo").append("<div>Families in Colony <ul id='familylist'></ul></div>");
        remfamilies.query("my_index/by_colony", {
            key : colonyid, 
            include_docs : true
        }).then(function(result){
            var networth = 0;
            for(var i=0; i < result.rows.length; i++) {
                $("#familylist").append("<li>" + result.rows[i].doc.name + 
                ":" + numeral(result.rows[i].doc.networth).format(currency) + "</li>");
                networth += parseFloat(result.rows[i].doc.networth);
            }
            $("#colonyinfo").append("<div>Total Networth: " + numeral(networth).format(currency));
            if(networth != colonydoc.networth) {
                colonydoc.networth = networth;
                remcolonies.put(colonydoc).catch(function(err){console.log("Error updating colony info : " + err)});
            } 
        })
        if(colonydoc.hive != undefined)
            updatehiveinfo(colonydoc.hive)
        else
            sethiveform(colonydoc._id)
    }).catch(function(err){console.log("Error updating colony info 2 : " + err + "ID >>>>> " + colonyid)});
}

function updatehiveinfo(hiveid){
    remhives.get(hiveid).then(function(hivedoc){
        // Display header
        $("#hiveinfo").html("<h1>Hive Information</h1><div>Hive : " + hivedoc.name + "</div>");
        
        // Display hive manager
        remusers.get(hivedoc.manager).then(function(userdoc){
            $("#hiveinfo").append("<div>Manager: " + fullname(userdoc) + "</div>")
        })
        
        // Display colonies
        $("#hiveinfo").append("<div>Colonies in Hive <ul id='colonylist'></ul></div>");
        remcolonies.query("my_index/by_hive", {
            key : hiveid, 
            include_docs : true
        }).then(function(result){
            var networth = 0;
            for(var i=0; i < result.rows.length; i++) {
                $("#colonylist").append("<li>" + result.rows[i].doc.name + 
                ":" + numeral(result.rows[i].doc.networth).format(currency) + "</li>");
                networth += parseFloat(result.rows[i].doc.networth);
            }
            $("#hiveinfo").append("<div>Total Networth: " + numeral(networth).format(currency));
            if(networth != hivedoc.networth) {
                hivedoc.networth = networth;
                remhives.put(hivedoc).catch(function(err){console.log("Error updating hive info : " + err)});
            } 
        })
    }).catch(function(err){console.log("Error updating hive info 2 : " + err +JSON.stringify(hiveid) )});
}


function setfamilyform(userid) {
    $("#familyinfo").html("<h1>Family Information</h1>");
    $("#familyinfo").append(newcollapsible("addfamily", "btnAddFamily","Add New Family"));
    $("#addfamily").append(newform("newfamilyform"));
    $("#newfamilyform").find("fieldset").append(newtextfield("familyid", "Family ID"));
    $("#newfamilyform").find("fieldset").append(newtextfield("familyname", "Famiy Name"));
    $("#newfamilyform").find("fieldset").append(newsubmit("addfamily(); return(false)", "Add Family"));
    
    $("#familyinfo").append(newcollapsible("joinfamily", "btnJoinFamily","Join Existing Family"));
    $("#joinfamily").append(newform("joinfamilyform"));
    $("#joinfamilyform").find("fieldset").append(newselect("familyselect","Family List"));
    
    setupselect(families, "#familyselect");

    $("#joinfamilyform").find("fieldset").append(newsubmit("joinfamily(); return(false)", "Join Family"));
}

function sethiveform(colonyid){
    $("#hiveinfo").html("<h1>Hive Information</h1>");
    $("#hiveinfo").append(newcollapsible("addhive", "btnAddHive","Add New Hive"));
    $("#addhive").append(newform("newhiveform"));
    $("#newhiveform").find("fieldset").append("<input type='hidden' name='colonyid' id='colonyid' value='" + colonyid + "'>")
    $("#newhiveform").find("fieldset").append(newtextfield("hiveid", "Hive ID"));
    $("#newhiveform").find("fieldset").append(newtextfield("hivename", "Hive Name"));
    $("#newhiveform").find("fieldset").append(newsubmit("addhive(); return(false)", "Add Hive"));
    
    $("#hiveinfo").append(newcollapsible("joinhive", "btnJoinHive","Join Existing Hive"));
    $("#joinhive").append(newform("joinhiveform"));
    $("#joinhiveform").find("fieldset").append(newselect("hiveselect","Hive List"));
    
    setupselect(hives, "#hiveselect");

    $("#joinhiveform").find("fieldset").append(newsubmit("joinhive(); return(false)", "Join Hive"));
}

function setcolonyform(familyid){
    alert("Colony form family id : " + familyid);
    $("#colonyinfo").html("<h1>Colony Information</h1>");
    $("#colonyinfo").append(newcollapsible("addcolony", "btnAddColony","Add New colony"));
    $("#addcolony").append(newform("newcolonyform"));
    $("#newcolonyform").find("fieldset").append("<input type='hidden' name='familyid' id='familyid' value='" + familyid + "'>")
    $("#newcolonyform").find("fieldset").append(newtextfield("colonyid", "Colony ID"));
    $("#newcolonyform").find("fieldset").append(newtextfield("colonyname", "Colony Name"));
    $("#newcolonyform").find("fieldset").append(newsubmit("addcolony(); return(false)", "Add Colony"));
    
    $("#colonyinfo").append(newcollapsible("joincolony", "btnJoinColony","Join Existing Colony"));
    $("#joincolony").append(newform("joincolonyform"));
    $("#joincolonyform").find("fieldset").append(newselect("colonyselect","colony List"));
    
    setupselect(colonies, "#colonyselect");

    $("#joincolonyform").find("fieldset").append(newsubmit("joincolony(); return(false)", "Join Colony"));
}

function newcollapsible(id, buttonid, title){
    return  "<div ><div><button id=\"" + buttonid + "\" class=\"collapsebutton\" onclick=\"toggle_div('#" + buttonid + "','#" + id + "')\">+ " +
        title + "</button></div>" +
        "<div id=\"" + id +"\" style=\"display:none\" class=\"collapsible\"></div>";
}

function newtextfield(id, label){
    return "<div class=\"pure-control-group\">"+
                "<input id=\"" + id + "\" type=\"text\" placeholder=\"" + label + "\">" +
            "</div>"
}

function newform(id){
    return "<form id=\"" + id + "\" class=\"pure-form pure-form-aligned\"><fieldset></fieldset></form>"
}

function newsubmit(script, label){
    return "<div class=\"pure-controls\">" +
                "<button type=\"submit\" onclick=\"" + script + "\" class=\"pure-button pure-button-primary\">" + label +"</button>" +
            "</div>"
}

function newselect(id, label){
    return "<div class=\"pure-controls\">" +
                "<label for=\"" + id + "\" class=\"show\">" + label + "</label>" +
                "<select id=\"" + id + "\">" +
                "</select>" +
            "</div>"
}

function setupselect(docs, selecttag){
    docs.allDocs({include_docs: true}).then(function(result){
        for(var i = 0; i < result.rows.length; i++){
            $(selecttag).append("<option value='" + result.rows[i].id + "'>" + result.rows[i].doc.name + "</option>")
        }
    })
}

function logout(){
    localStorage.removeItem('userid'); 
    localStorage.removeItem('user');
    localStorage.removeItem('family');
    localStorage.removeItem('colony');
    localStorage.removeItem('hive');
    window.location.replace('user.html');
}
