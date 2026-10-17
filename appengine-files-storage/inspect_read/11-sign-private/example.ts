const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/file/signurl";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "location": "video-lab-mut4jkwd/course-files-1009/private/supplier-sheet.pdf",
  "options": {
    "expiry": 900
  }
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
