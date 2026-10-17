const base = process.env.BASE || "https://appengine.appmint.io";
const route = "/repository/find/fileinfo";
const headers = {orgid: process.env.ORG_ID, Authorization: "Bearer "+process.env.TOKEN, "Content-Type":"application/json"};
const body = {
  "query": {
    "data.path": {
      "$regex": "course-files-1009/"
    }
  },
  "options": {
    "page": 1,
    "pageSize": 20
  }
};
const response: Response = await fetch(base + route, {
  method: "POST", headers,
  body: JSON.stringify(body)
});
const text = await response.text();
let result; try { result = JSON.parse(text); } catch { result = text; }
console.log(response.status, result);
