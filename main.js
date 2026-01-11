/* ========== FIREBASE INIT ========== */
firebase.initializeApp({
  apiKey: "AIzaSyAI5nA49KkR5VsPn3QpjWOdM0lv2nEQu3U",
  authDomain: "private-chat-app-2986d.firebaseapp.com",
  projectId: "private-chat-app-2986d"
});
var db = firebase.firestore();

/* ========== USER ========== */
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

/* ========== DOM ========== */
var usernameEl = document.getElementById("username");
var myCodeEl = document.getElementById("myCode");
var chatListEl = document.getElementById("chatList");
var chatBoxEl = document.getElementById("chatBox");
var chatUserEl = document.getElementById("chatUser");
var msgInputEl = document.getElementById("msgInput");

/* ========== GLOBAL ========== */
var chatId = null;
var otherUser = null;

/* ========== HOME PAGE ========== */
if (usernameEl && myCodeEl && chatListEl) {
  usernameEl.innerText = username;
  myCodeEl.innerText = myCode;

  db.collection("chats")
    .where("users", "array-contains", myCode)
    .orderBy("time", "desc")
    .onSnapshot(snap => {
      chatListEl.innerHTML = "";

      snap.forEach(doc => {
        var data = doc.data();
        var other = data.users.find(u => u !== myCode);

        var card = document.createElement("div");
        card.className = "chat-card";
        card.innerHTML = `<b>${other}</b><p>${data.last || ""}</p>`;
        card.onclick = () => {
          location.href = "chat.html?c=" + doc.id;
        };

        chatListEl.appendChild(card);
      });
    });
}

function newChat() {
  var other = prompt("Enter user code");
  if (!other) return;

  var id = [myCode, other].sort().join("__");

  db.collection("chats").doc(id).set({
    users: [myCode, other],
    last: "",
    time: Date.now()
  });

  location.href = "chat.html?c=" + id;
}

function changeUsername() {
  var n = prompt("New username");
  if (n) {
    localStorage.setItem("username", n);
    location.reload();
  }
}

/* ========== CHAT PAGE ========== */
if (chatBoxEl && chatUserEl) {
  var params = new URLSearchParams(location.search);
  chatId = params.get("c");
  if (!chatId) location.href = "index.html";

  db.collection("chats").doc(chatId).get().then(doc => {
    if (!doc.exists) return;
    otherUser = doc.data().users.find(u => u !== myCode);
    chatUserEl.innerText = otherUser;
  });

  db.collection("chats").doc(chatId)
    .collection("messages")
    .orderBy("time")
    .onSnapshot(snap => {
      chatBoxEl.innerHTML = "";

      snap.forEach(d => {
        var m = d.data();
        var div = document.createElement("div");
        div.className = "msg " + (m.from === myCode ? "me" : "them");
        div.innerText = m.text;
        chatBoxEl.appendChild(div);
      });

      chatBoxEl.scrollTop = chatBoxEl.scrollHeight;
    });
}

function sendMsg() {
  if (!chatId || !msgInputEl.value) return;

  db.collection("chats").doc(chatId)
    .collection("messages")
    .add({
      from: myCode,
      user: username,
      text: msgInputEl.value,
      time: Date.now()
    });

  db.collection("chats").doc(chatId).set({
    last: msgInputEl.value,
    time: Date.now()
  }, { merge: true });

  msgInputEl.value = "";
}

function goHome() {
  location.href = "index.html";
}

/* ========== PWA ========== */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}
