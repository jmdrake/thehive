// Uses:
//     jQuery - https://api.jquery.com
//     PouchDB - http://pouchdb.com/

var clouddb = "https://projecthive.iriscouch.com/";
var users = new PouchDB("hiveusers");
var remusers = new PouchDB(clouddb + "hiveusers");
var mainurl = localStorage.getItem("main");
if(mainurl==null)mainurl="thehive.html";

function login() {
    var userid = $("#login").find("#userid").val();
    var password = $("#login").find("#password").val();

    users.get($("#user").val()).then(function(userdoc){
        if(userdoc.password == password) {
            localStorage.setItem("userid", userid);
            localStorage.setItem("user", JSON.stringify(userdoc));
            window.location.replace(mainurl);
        } else {
            alert("Wrong password")
        }
    }).catch(function(err){
        remusers.get(userid).then(function(userdoc){
            if(userdoc.password == password) {
                localStorage.setItem("userid", userid);
                localStorage.setItem("user", JSON.stringify(userdoc));
                window.location.replace(mainurl);
            } else {
                alert("Wrong password" + userdoc.password)
            }
        }).catch(function(err){
            if(err.status == "404") {
                alert("Username not found")
            } else {
                alert(err)
            }
        })
    })
}


function register(){
    var userid = $("#register").find("#userid").val();
    var newuser = {
        "_id" : userid,
        "password" : $("#register").find("#password").val(),
        "fname" : $("#firstname").val(),
        "lname" : $("#lastname").val(),
        "email" : $("#email").val(),
        "networth" : $("#networth").val(),
        "dob" : $("#dob").val(),
        "marital" : $("#marital").val()
    };
    // Add user to local db
    users.put(newuser).then(function(result1){
        localStorage.setItem("userid", userid);
        localStorage.setItem("user", JSON.stringify(newuser));
        users.replicate.to(remusers).then(function(res){
            window.location.replace(mainurl)
        }).catch(function(err){
            console.log("Error replicating database : " + err);
        });
    }).catch(function(err){
        if(err.status=="409") {
            alert("User name already in use")
        } else {
            console.log(err);
        }
    })
}