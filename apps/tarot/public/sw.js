/* global self */
// crocwork tarot service worker: shows the daily reminder. The push itself is empty (the Worker
// sends no payload), so the words live here.
self.addEventListener("push", (event) => {
  event.waitUntil(
    self.registration.showNotification("ไพ่ประจำวันของคุณมาแล้ว", {
      body: "นกฮูกวางไพ่ของวันนี้ไว้ให้ แวะเช็กอินรับเหรียญด้วยนะ",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: "daily-card",
      lang: "th",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) if ("focus" in w) return w.focus();
      return self.clients.openWindow("/");
    }),
  );
});
