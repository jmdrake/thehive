var users = new PouchDB("hiveusers");

var clouddb = "https://projecthive.iriscouch.com/";
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



