// Uses:
//     jQuery - https://api.jquery.com
//     PouchDB - http://pouchdb.com/

var users = new PouchDB("hiveusers");
var dbserver = "https://projecthive.iriscouch.com/";
var remusers = new PouchDB(dbserver + "hiveusers");

function login(){
    var userid = $("#login").find("#userid").val();
    var password = $("#login").find("#password").val();
    // Get user from local db
    users.get(userid).then(function(userdoc){
        if(password==userdoc.password){
            localStorage.setItem("userid", userid);
            localStorage.setItem("user", JSON.stringify(remuserdoc));
            window.location.replace("thehive.html");
        } else {
            console.log("Password doesn't match local database");
            alert("Wrong username or password")
        }
    }).catch(function(err){
        if(err.status == '404'){
            // If user not in local db check remote db
            remusers.get(userid).then(function(remuserdoc){
                if(password==remuserdoc.password){
                    localStorage.setItem("userid", userid);
                    localStorage.setItem("user", JSON.stringify(remuserdoc));
                    window.location.replace("thehive.html");
                } else {
                    console.log("Password doesn't match remote database");
                    alert("Wrong username or password")
                }
            }).catch(function(err){
                if(err.status == '404')
                    console.log("Doc not found in remote database");
                    alert("Wrong username or password")
            })
        } else console.log(err)});
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
        // Add user to remote db
        // Todo : Need to handle case where user has been added to local db but already exists in remote db.
        remusers.put(newuser).then(function(result2){
            window.location.replace("thehive.html");
        })
    }).catch(function(err){
        if(err.status=="409") {
            alert("User name already in use")
        } else {
            alert(err);
        }
    })
}