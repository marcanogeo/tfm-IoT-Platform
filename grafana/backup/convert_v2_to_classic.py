import json, sys
src, dst = sys.argv[1], sys.argv[2]
d = json.load(open(src))
DS = {"type": "influxdb", "uid": "P951FEA4DE68E13C5"}
panels, y, pid = [], 0, 100
for row in d["layout"]["spec"]["rows"]:
    rs = row["spec"]
    pid += 1
    panels.append({"type": "row", "id": pid, "title": rs.get("title", ""), "collapsed": False,
                   "gridPos": {"h": 1, "w": 24, "x": 0, "y": y}, "panels": []})
    y += 1
    maxy = 0
    for it in rs["layout"]["spec"]["items"]:
        s = it["spec"]
        el = d["elements"][s["element"]["name"]]["spec"]
        viz = el["vizConfig"]
        targets = []
        for q in el["data"]["spec"]["queries"]:
            qs = q["spec"]
            targets.append({"refId": qs.get("refId", "A"), "datasource": DS,
                            "query": qs["query"]["spec"]["query"], "hide": qs.get("hidden", False)})
        panels.append({
            "id": el["id"], "type": viz["group"], "title": el.get("title", ""),
            "description": el.get("description", ""), "datasource": DS, "targets": targets,
            "fieldConfig": viz["spec"].get("fieldConfig", {"defaults": {}, "overrides": []}),
            "options": viz["spec"].get("options", {}),
            "transformations": el["data"]["spec"].get("transformations", []),
            "gridPos": {"h": s["height"], "w": s["width"], "x": s["x"], "y": y + s["y"]},
        })
        maxy = max(maxy, s["y"] + s["height"])
    y += maxy
ts = d.get("timeSettings", {})
out = {
    "uid": "tfm-iot-monitoreo", "title": d["title"], "tags": d.get("tags", []),
    "editable": d.get("editable", True), "schemaVersion": 39, "version": 1,
    "graphTooltip": 0, "liveNow": d.get("liveNow", False),
    "time": {"from": ts.get("from", "now-6h"), "to": ts.get("to", "now")},
    "timezone": ts.get("timezone", "browser"), "refresh": ts.get("autoRefresh") or "10s",
    "timepicker": {"refresh_intervals": ts.get("autoRefreshIntervals", [])},
    "annotations": {"list": [{"builtIn": 1, "datasource": {"type": "grafana", "uid": "-- Grafana --"},
        "enable": True, "hide": True, "iconColor": "rgba(0, 211, 255, 1)",
        "name": "Annotations & Alerts", "type": "dashboard"}]},
    "templating": {"list": []}, "links": [], "panels": panels,
}
json.dump(out, open(dst, "w"), indent=2, ensure_ascii=False)
print("OK:", len([p for p in panels if p["type"] != "row"]), "paneles,", len([p for p in panels if p["type"] == "row"]), "filas")
for p in panels: print(" ", p["type"], "|", p["title"], "|", p["gridPos"])
