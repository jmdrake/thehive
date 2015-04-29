var userid = localStorage.getItem("userid");
var user = JSON.parse(localStorage.getItem("user"));
var colonyid = undefined;
var users = new PouchDB("hiveusers");
var colonies = new PouchDB("hivecolonies");
var hives = new PouchDB("hivehives");
var families = new PouchDB("hivefamilies");
var currency = "$0,0.00";

var dbserver = "https://projecthive.iriscouch.com/";
var remusers = new PouchDB(dbserver + "hiveusers");
var remcolonies = new PouchDB(dbserver + "hivecolonies");
var remhives = new PouchDB(dbserver + "hivehives");
var remfamilies = new PouchDB(dbserver + "hivefamilies");

families.replicate.from(remfamilies).on('complete', function(){
    console.log("Family database replicated");
    colonies.replicate.from(remcolonies).on('complete', function () {
        console.log("Colony database replicated");
        hives.replicate.from(remhives).on('complete', function () {
            console.log("Hives database replicated");
            main();
        })
    })        
}).on('error', function (err) {
    console.log("Error replicating user database");
    main();
});

function main(){
    $("userinfo").html(user.fname);
    if(user.family != undefined) {
        families.get(user.family).then(function(family){
            updatefamilyinfo(family);
            if(family.colony != undefined) {
                colonies.get(family.colony).then(function(colony){
                    updatecolonyinfo(colony);
                    if(colony.hive != undefined) {
                        hives.get(colony.hive).then(function(hive){
                            updatehiveinfo(hive)
                        })
                    } else {
                        sethiveform(colony._id)
                    }
                })
            } else {
                setcolonyform(family._id)
            }
        })
    } else {
        setfamilyform(user._id)
    }
    
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
        manager : userid
    };
    
    newfamily.newworth = user.networth;
    user.family = newfamily._id;
    users.put(user).then(function(res) {
        updatefamilyinfo(newfamily);
        setcolonyform(userid);
    }).catch(function(err) {
        alert("Error adding family : " + err)
    })
}

function joinfamily(){
    // add familyid to userdoc then update family information
    var familyid = $("#familyselect").val();
    user.family = familyid;
    users.put(user).then(function(res) {
        families.get(familyid).then(function(familydoc) {
            updatefamilyinfo(familydoc)
        });
        remusers.put(user);
    }).catch(function(err){
        alert("Error joining family : " + err)
    })
}

function addcolony(){
    var familyid = $("#familyid").val();
    var newcolony = {
        _id : $("#colonyid").val(),
        name : $("#colonyname").val(),
        manager : userid
    };
    
    families.get(familyid).then(function(familydoc){
        newcolony.networth = familydoc.networth;
        familydoc.colony = newcolony._id;
        families.put(familydoc).then(function(res){
            updatecolonyinfo(newcolony);
            sethiveform(familyid);
        });
        remfamilies.put(familydoc);
    }).catch(function(err){
        alert("Error adding colony : " + err)
    })
}

function joincolony(){
    var colonyid = $("#colonyselect").val();
    var familyid = $("#familyid").val();
    families.get(familyid).then(function(familydoc){
        familydoc.colony = colonyid;
        families.put(familydoc).then(function(res){
            colonies.get(colonyid).then(function(colonydoc){
                updatecolonyinfo(colonydoc)
            })
        });
        remfamilies.put(familydoc);
    }).catch(function(err){
        alert("Error joining colony : " + err)
    })
}
    
function addhive(){
    var colonyid = $("#colonyid").val();
    var newhive = {
        _id : $("#hiveid").val(),
        name : $("#hivename").val(),
        manager : userid
    };
    
    colonies.get(colonyid).then(function(colonydoc){
        colonydoc.hive = newhive._id;
        colonies.put(colonydoc).then(function(res) {
            updatehiveinfo(newhive);
        });
        remcolonies.put(colonydoc);
    }).catch(function(err) {
        alert("Error adding hive : " + err)
    });
}

function joinhive(){
    var hiveid = $("#hiveselect").val();
    var colonyid = $("#colonyid").val();
    colonies.get(colonyid).then(function(colonydoc){
        colonydoc.hive = hiveid;
        colonies.put(colonydoc).then(function(res) {
            hives.get(hiveid).then(function(hivedoc){
                updatehiveinfo(hivedoc)
            })
        });
        remcolonies.put(colonydoc);
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


function updatefamilyinfo(familydoc){
    $("#familyinfo").html(
        "<h1>Family Information</h1>" +
        "<div>Family:" + familydoc.name + "</div>")
    
    remusers.get(familydoc.manager).then(function(userdoc){
        $("#familyinfo").append("<div>Manager: " + userdoc.fname + " " + userdoc.lname + "</div>");
    }).catch(function(err) {
        alert("Error updating family info : " + err)
    })
    
    $("#familyinfo").append("<div>Members In Family <ul id='memberlist'></ul></div>");
    remusers.allDocs({include_docs : true}).then(function(result){
        familydoc.networth = 0;
        for(var i=0; i<result.rows.length; i++) {
            if(result.rows[i].doc.family == familydoc._id) {
                $("#memberlist").append("<li>" + result.rows[i].doc.fname + " " + result.rows[i].doc.lname + 
                ":" + numeral(result.rows[i].doc.networth).format(currency) + "</li>");
                familydoc.networth += parseFloat(result.rows[i].doc.networth);
            }
        }
        families.put(familydoc).then(function(res){
            $("#familyinfo").append("<div>Total Networth: " + numeral(familydoc.networth).format(currency));
            if(familydoc.colony != undefined)
                colonies.get(familydoc.colony).then(function(colonydoc){
                    updatecolonyinfo(colonydoc);
                });
            families.replicate.to(remfamilies).catch(function(err){console.log("Error updating families 5")})
        }).catch(function(err){console.log("Error updating famiy info 2 : " + err)});
    }).catch(function(err){alert("Error updating family info 3: " + err)});
}

function updatecolonyinfo(colonydoc){
    $("#colonyinfo").html(
        "<h1>Colony Information</h1>" +
        "<div>Colony:" + colonydoc.name + "</div>")
    
    remusers.get(colonydoc.manager).then(function(userdoc){
        $("#colonyinfo").append("<div>Manager: " + userdoc.fname + " " + userdoc.lname + "</div>");
    }).catch(function(err) {
        console.log("Error updating colonies 1 :"  + err)
    })
    
    $("#colonyinfo").append("<div>Families In The Colony <ul id='familylist'></ul></div>");
    families.allDocs({include_docs : true}).then(function(result){
        colonydoc.networth = 0;
        for(var i=0; i<result.rows.length; i++) {
            if(result.rows[i].doc.colony == colonydoc._id) {
                $("#familylist").append("<li>" + result.rows[i].doc.name + ":" + 
                    numeral(result.rows[i].doc.networth).format(currency) + "</li>");
                colonydoc.networth += result.rows[i].doc.networth;
            }
        }
        // alert(colonydoc.networth);
        colonies.put(colonydoc).then(function(res){
            $("#colonyinfo").append("<div>Total Networth : " + numeral(colonydoc.networth).format(currency));
            if(colonydoc.hive != undefined) {
                hives.get(colonydoc.hive).then(function(hivedoc){
                    updatehiveinfo(hivedoc);
                })
            }
            colonies.replicate.to(remcolonies).catch(function(err){console.log("Error updating colonies 3" + err)})
        });
    }).catch(function(err){console.log("Error updating colonies 2 : " + err)})
}

function updatehiveinfo(hivedoc){
    $("#hiveinfo").html("<h1>Hive Information</h1>");
    $("#hiveinfo").append("<div>Hive: " + hivedoc.name + "</div>");

    remusers.get(hivedoc.manager).then(function(userdoc){
        $("#hiveinfo").append("<div>Manager: (" + hivedoc.manager +") " + userdoc.fname + " " + userdoc.lname + "</div>");
    }).catch(function(err) {
        console.log("Error updating hives 1 : " + err)
    })

    $("#hiveinfo").append("<div>Colonies In Hive <ul id='colonylist'></ul></div>");
    colonies.allDocs({include_docs : true}).then(function(result){
        hivedoc.networth = 0;    
        for(var i=0; i<result.rows.length; i++) {
            if(result.rows[i].doc.hive == hivedoc._id) {
                $("#colonylist").append("<li>" + result.rows[i].doc.name + ":" + 
                    numeral(result.rows[i].doc.networth).format(currency) + "</li>");
                hivedoc.networth += result.rows[i].doc.networth;
            }
        }
        hives.put(hivedoc).then(function(res){
            $("#hiveinfo").append("<div>Total Networth : " + numeral(hivedoc.networth).format(currency) + "</div>");
        });
        hives.replicate.to(remhives).catch(function(err){console.log("Error updating hives 3" + err)});
    }).catch(function(err){console.log("Error updating hives 2 : " + err)})
}

function setfamilyform(userid) {
    console.log("Trace 4");
    $("#familyinfo").html("<h1>Family Information</h1>");
    $("#familyinfo").append(newcollapsible("addfamily", "btnAddFamily","Add New Family"));
    $("#addfamily").append(newform("newfamilyform"));
    $("#newfamilyform").find("fieldset").append(newtextfield("familyid", "Family ID"));
    $("#newfamilyform").find("fieldset").append(newtextfield("familyname", "Famiy Name"));
    $("#newfamilyform").find("fieldset").append(newsubmit("addfamily(); return(false)", "Add Family"));
    
    $("#familyinfo").append(newcollapsible("joinfamiy", "btnJoinFamily","Join Existing Family"));
    $("#joinfamily").append(newform("joinfamiyform"));
    $("#joinfamiyform").find("fieldset").append(newselect("familyselect","Family List"));
    
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
    $("#newhiveform").find("fieldset").append(newtextfield("hivedescription", "Hive Description"));
    $("#newhiveform").find("fieldset").append(newsubmit("addhive(); return(false)", "Add Hive"));
    
    $("#hiveinfo").append(newcollapsible("joinhive", "btnJoinHive","Join Existing Hive"));
    $("#joinhive").append(newform("joinhiveform"));
    $("#joinhiveform").find("fieldset").append(newselect("hiveselect","Hive List"));
    
    setupselect(hives, "#hiveselect");

    $("#joinhiveform").find("fieldset").append(newsubmit("joinhive(); return(false)", "Join Hive"));
}

function setcolonyform(familyid){
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

