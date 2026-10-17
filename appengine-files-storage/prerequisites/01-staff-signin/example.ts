const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/profile/user/signin";
const headers = {orgid: process.env.ORG_ID, "Content-Type":"application/json"};
const body = {
  "email": "video-lab-mut4jkwd@example.com",
  "password": "[redacted]"
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
