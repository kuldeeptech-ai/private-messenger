/* ---------- FIREBASE INIT ---------- */
firebase.initializeApp({
  apiKey: "AIzaSyAI5nA49KkR5VsPn3QpjWOdM0lv2nEQu3U",
  authDomain: "private-chat-app-2986d.firebaseapp.com",
  projectId: "private-chat-app-2986d"
});
var db = firebase.firestore();

/* ---------- USER (PER DEVICE) ---------- */
function genCode() {
  return "USR-" + Math.random().toString(36).substr(2,6).toUpperCase();
}

var myCode = localStorage.getItem("myCode");
if (!myCode) {
  myCode = genCode();
  localStorage.setItem("myCode", myCode);
}

var username = localStorage.getItem("username");
if (!username) {
  username = prompt("Enter username") || "User";
  localStorage.setItem("username", username);
}

/* ---------- DOM SAFE REFERENCES ---------- */
var usernameEl = document.getElementById("username");
var myCodeEl = document.getElementById("myCode");
var chatListEl = document.getElementById("chatList");
var chatBoxEl = document.getElementById("chatBox");
var chatUserEl = document.getElementById("chatUser");
var msgInputEl = document.getElementById("msgInput");

/* ---------- GLOBAL CHAT STATE ---------- */
var chatId = null;
var otherUser = null;

/* ---------- HOME PAGE ---------- */
if (usernameEl && myCodeEl && chatListEl) {
  usernameEl.innerText = username;
  myCodeEl.innerText = myCode;

  db.collection("users").doc(myCode).collection("chats")
    .orderBy("time", "desc")
    .onSnapshot(snap => {
      chatListEl.innerHTML = "";
      snap.forEach(d => {
        var data = d.data() || {};
        var other = d.id.replace(myCode,"").replace("__","");

        var card = document.createElement("div");
        card.className = "chat-card";
        card.innerHTML = `<b>${other}</b><p>${data.last || ""}</p>`;
        card.onclick = () => {
          location.href = "chat.html?c=" + d.id;
        };

        // long press delete (list only)
        let t;
        card.addEventListener("touchstart",()=>{
          t=setTimeout(()=>{
            if(confirm("Delete chat from list?")){
              d.ref.delete();
            }
          },600);
        });
        card.addEventListener("touchend",()=>clearTimeout(t));

        chatListEl.appendChild(card);
      });
    });
}

function changeUsername() {
  var n = prompt("New username");
  if (n) {
    localStorage.setItem("username", n);
    location.reload();
  }
}

function newChat() {
  var other = prompt("Enter user code");
  if (!other) return;

  var id = [myCode, other].sort().join("__");

  db.collection("users").doc(myCode).collection("chats")
    .doc(id).set({ last:"", time:Date.now() });

  db.collection("users").doc(other).collection("chats")
    .doc(id).set({ last:"", time:Date.now() });

  location.href = "chat.html?c=" + id;
}

/* ---------- CHAT PAGE ---------- */
if (chatBoxEl && chatUserEl) {
  var params = new URLSearchParams(location.search);
  chatId = params.get("c");
  if (!chatId) location.href = "index.html";

  otherUser = chatId.replace(myCode,"").replace("__","");
  chatUserEl.innerText = otherUser;

  db.collection("chats").doc(chatId).collection("messages")
    .orderBy("time")
    .onSnapshot(snap => {
      chatBoxEl.innerHTML = "";
      snap.forEach(d => {
        var m = d.data();
        var div = document.createElement("div");
        div.className = "msg " + (m.from === myCode ? "me" : "them");
        div.innerText = m.text;

        // long press delete for everyone
        let t;
        div.addEventListener("touchstart",()=>{
          t=setTimeout(()=>{
            if(confirm("Delete for everyone?")){
              d.ref.delete();
            }
          },600);
        });
        div.addEventListener("touchend",()=>clearTimeout(t));

        chatBoxEl.appendChild(div);
      });
      chatBoxEl.scrollTop = chatBoxEl.scrollHeight;
    });
}

function sendMsg() {
  if (!chatId || !msgInputEl.value) return;

  db.collection("chats").doc(chatId).collection("messages").add({
    from: myCode,
    user: username,
    text: msgInputEl.value,
    time: Date.now()
  });

  db.collection("users").doc(myCode).collection("chats")
    .doc(chatId).set({ last: msgInputEl.value, time:Date.now() }, { merge:true });

  db.collection("users").doc(otherUser).collection("chats")
    .doc(chatId).set({ last: msgInputEl.value, time:Date.now() }, { merge:true });

  msgInputEl.value = "";
}

function goHome() {
  location.href = "index.html";
}

/* ---------- PWA ---------- */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}