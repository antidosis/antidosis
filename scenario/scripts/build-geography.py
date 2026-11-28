#!/usr/bin/env python3
"""Build the bundled Central Coast geography used by the 3D scenario.

Sources: OpenStreetMap contributors (places, water, coastline, roads), AWS/Mapzen
Terrain Tiles (elevation), and the public OSRM demo (illustrative road journeys).
The browser never contacts these services at runtime.
"""
from pathlib import Path
import concurrent.futures
import json
import math
import time

import requests
from PIL import Image
from shapely.geometry import LineString, Point, Polygon, box
from shapely.ops import unary_union, polygonize
from shapely import contains_xy

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "data" / "coast.json"
TMP = Path("/tmp")
BOUNDS = {"south": -33.55, "west": 151.15, "north": -33.14, "east": 151.60}
CENTER = {"lat": -33.345, "lon": 151.375}
KM_SCALE = 1.5
VERTICAL_SCALE = 0.013
GRID = 257
USER_AGENT = "Antidosis geographic scenario design/1.0"
SELECTED = [
    "Wyee", "Wyee Point", "Doyalson", "Blue Haven", "San Remo", "Budgewoi",
    "Noraville", "Norah Head", "Toukley", "Gorokan", "Lake Haven", "Hamlyn Terrace",
    "Woongarrah", "Wadalba", "Warnervale", "Wyong", "Watanobbi", "Tuggerah",
    "Chittaway Bay", "Berkeley Vale", "The Entrance", "The Entrance North", "Long Jetty",
    "Killarney Vale", "Bateau Bay", "Forresters Beach", "Wamberal", "Terrigal",
    "North Avoca", "Avoca Beach", "Kincumber", "Erina", "Gosford", "Narara", "Lisarow",
    "Ourimbah", "Somersby", "Copacabana", "MacMasters Beach", "Umina Beach", "Woy Woy",
    "Ettalong Beach", "Empire Bay", "Daleys Point",
]
ROUTE_PAIRS = {
    "care": ("Woy Woy", "Kincumber"),
    "garden": ("Umina Beach", "Woy Woy"),
    "skills": ("Wyong", "Gosford"),
    "repair": ("Noraville", "MacMasters Beach"),
    "ride": ("Kincumber", "Gosford"),
    "website": ("Wyong", "Blue Haven"),
    "market": ("Budgewoi", "The Entrance"),
    "bees": ("Somersby", "Wyee"),
}


def get_json(url, params, timeout=90, attempts=4):
    for attempt in range(attempts):
        try:
            response = requests.get(url, params=params, timeout=timeout,
                                    headers={"User-Agent": USER_AGENT})
            if response.ok:
                return response.json()
            print("HTTP", response.status_code, url)
        except Exception as error:
            print(type(error).__name__, error)
        time.sleep(1.5)
    raise RuntimeError(f"Could not retrieve {url}")


def overpass(name, query):
    path = TMP / f"antidosis-{name}.json"
    if path.exists():
        return json.loads(path.read_text())
    data = get_json("https://overpass-api.de/api/interpreter", {"data": query}, 120)
    path.write_text(json.dumps(data))
    return data


def terrain():
    path = TMP / "antidosis-terrain-mosaic.png"
    if path.exists():
        return Image.open(path).convert("RGB")
    z, x0, y0 = 12, 3767, 2448
    def fetch(xy):
        x, y = xy
        url = f"https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
        response = requests.get(url, timeout=45)
        response.raise_for_status()
        from io import BytesIO
        return x, y, Image.open(BytesIO(response.content)).convert("RGB")
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        tiles = list(pool.map(fetch, [(x, y) for x in range(x0, x0 + 6) for y in range(y0, y0 + 6)]))
    mosaic = Image.new("RGB", (1536, 1536))
    for x, y, image in tiles:
        mosaic.paste(image, ((x - x0) * 256, (y - y0) * 256))
    mosaic.save(path)
    return mosaic


DEM = terrain()
DEM_PIXELS = DEM.load()


def elevation(lat, lon):
    z = 12
    gx = (lon + 180) / 360 * 2 ** z * 256 - 3767 * 256
    gy = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * 2 ** z * 256 - 2448 * 256
    gx = min(DEM.width - 1.001, max(0, gx))
    gy = min(DEM.height - 1.001, max(0, gy))
    x0, y0 = int(gx), int(gy)
    fx, fy = gx - x0, gy - y0
    values = []
    for x, y in [(x0, y0), (x0 + 1, y0), (x0, y0 + 1), (x0 + 1, y0 + 1)]:
        r, g, b = DEM_PIXELS[x, y]
        values.append(r * 256 + g + b / 256 - 32768)
    return (values[0] * (1 - fx) + values[1] * fx) * (1 - fy) + (values[2] * (1 - fx) + values[3] * fx) * fy


def project(lon, lat):
    x = (lon - CENTER["lon"]) * 111.32 * math.cos(math.radians(CENTER["lat"])) * KM_SCALE
    z = (CENTER["lat"] - lat) * 111.32 * KM_SCALE
    return [round(x, 4), round(z, 4)]


def valid_polygon(poly):
    if poly.is_empty:
        return []
    if not poly.is_valid:
        poly = poly.buffer(0)
    if poly.geom_type == "Polygon":
        return [poly]
    if poly.geom_type == "MultiPolygon":
        return list(poly.geoms)
    return []


def water_polygons(data):
    polygons = []
    for element in data["elements"]:
        if element["type"] == "way":
            geometry = element.get("geometry", [])
            coords = [(p["lon"], p["lat"]) for p in geometry]
            if len(coords) >= 4 and coords[0] == coords[-1]:
                polygons += valid_polygon(Polygon(coords))
        elif element["type"] == "relation":
            outers, inners = [], []
            for member in element.get("members", []):
                geometry = member.get("geometry", [])
                coords = [(p["lon"], p["lat"]) for p in geometry]
                if len(coords) < 2:
                    continue
                (outers if member.get("role") == "outer" else inners).append(LineString(coords))
            if not outers:
                continue
            outer_polys = list(polygonize(unary_union(outers)))
            inner_polys = list(polygonize(unary_union(inners))) if inners else []
            for poly in outer_polys:
                if inner_polys:
                    poly = poly.difference(unary_union(inner_polys))
                polygons += valid_polygon(poly)
    return [p for p in polygons if p.area > 0.00000002]


def ocean_crossings(data):
    segments = []
    seen = set()
    for element in data["elements"]:
        if element["id"] in seen:
            continue
        seen.add(element["id"])
        coords = [(p["lon"], p["lat"]) for p in element.get("geometry", [])]
        for a, b in zip(coords, coords[1:]):
            if abs(a[1] - b[1]) > 1e-9:
                segments.append((a, b))
    return segments


def simplify_line(coords, tolerance=0.000025):
    if len(coords) < 3:
        return coords
    return list(LineString(coords).simplify(tolerance).coords)


def main():
    place_query = '[out:json][timeout:40];node["place"~"suburb|town|village"](-33.55,151.15,-33.14,151.60);out body;'
    water_query = '[out:json][timeout:90];(way["natural"="water"](-33.55,151.15,-33.14,151.60);relation["natural"="water"](-33.55,151.15,-33.14,151.60););out tags geom;'
    coast_query = '[out:json][timeout:60];way["natural"="coastline"](-33.55,151.15,-33.14,151.60);out geom;'
    road_query = '[out:json][timeout:90];way["highway"~"motorway|trunk|primary|secondary"]["name"](-33.55,151.15,-33.14,151.60);out tags geom;'
    places_data = overpass("places", place_query)
    water_data = overpass("water", water_query)
    coast_data = overpass("coastline", coast_query)
    road_data = overpass("roads", road_query)

    places = {}
    for element in places_data["elements"]:
        name = element.get("tags", {}).get("name")
        if name in SELECTED and "lat" in element:
            lat, lon = element["lat"], element["lon"]
            places[name] = {
                "name": name, "lat": round(lat, 6), "lon": round(lon, 6),
                "p": project(lon, lat), "elevation": round(max(0, elevation(lat, lon)), 1),
            }
    missing = set(SELECTED) - set(places)
    if missing:
        raise RuntimeError(f"Missing places: {sorted(missing)}")

    print("Building water mask", flush=True)
    polygons = water_polygons(water_data)
    segments = ocean_crossings(coast_data)
    heights, water = [], []
    for row in range(GRID):
        lat = BOUNDS["north"] + (BOUNDS["south"] - BOUNDS["north"]) * row / (GRID - 1)
        crossings = []
        for a, b in segments:
            if min(a[1], b[1]) <= lat < max(a[1], b[1]):
                u = (lat - a[1]) / (b[1] - a[1])
                crossings.append(a[0] + (b[0] - a[0]) * u)
        # The easternmost intersection is the open-ocean boundary. Named bays and
        # lakes are added separately from OSM polygons below.
        coast_lon = max(crossings) if crossings else 151.58
        for col in range(GRID):
            lon = BOUNDS["west"] + (BOUNDS["east"] - BOUNDS["west"]) * col / (GRID - 1)
            h = elevation(lat, lon)
            heights.append(round(max(-3, h), 1))
            water.append(1 if lon > coast_lon else 0)
    for poly in polygons:
        minx, miny, maxx, maxy = poly.bounds
        c0 = max(0, int((minx - BOUNDS["west"]) / (BOUNDS["east"] - BOUNDS["west"]) * (GRID - 1)) - 1)
        c1 = min(GRID - 1, int((maxx - BOUNDS["west"]) / (BOUNDS["east"] - BOUNDS["west"]) * (GRID - 1)) + 1)
        r0 = max(0, int((miny - BOUNDS["north"]) / (BOUNDS["south"] - BOUNDS["north"]) * (GRID - 1)) - 1)
        r1 = min(GRID - 1, int((maxy - BOUNDS["north"]) / (BOUNDS["south"] - BOUNDS["north"]) * (GRID - 1)) + 1)
        if c1 < c0 or r1 < r0:
            continue
        xs = [BOUNDS["west"] + (BOUNDS["east"] - BOUNDS["west"]) * c / (GRID - 1) for c in range(c0, c1 + 1)]
        ys = [BOUNDS["north"] + (BOUNDS["south"] - BOUNDS["north"]) * r / (GRID - 1) for r in range(r0, r1 + 1)]
        xx, yy = zip(*[(x, y) for y in ys for x in xs])
        mask = contains_xy(poly, xx, yy)
        for i, hit in enumerate(mask):
            if hit:
                row = r0 + i // len(xs)
                col = c0 + i % len(xs)
                water[row * GRID + col] = 1

    roads = []
    for element in road_data["elements"]:
        geometry = element.get("geometry", [])
        if len(geometry) < 2:
            continue
        coords = simplify_line([(p["lon"], p["lat"]) for p in geometry])
        if len(coords) < 2:
            continue
        tags = element.get("tags", {})
        roads.append({
            "name": tags.get("name", "Local road"), "kind": tags.get("highway", "secondary"),
            "points": [[round(lon, 5), round(lat, 5)] for lon, lat in coords],
        })

    routes = {}
    for key, (origin, destination) in ROUTE_PAIRS.items():
        a, b = places[origin], places[destination]
        coordinates = f'{a["lon"]},{a["lat"]};{b["lon"]},{b["lat"]}'
        data = get_json(f"https://router.project-osrm.org/route/v1/driving/{coordinates}",
                        {"geometries": "geojson", "overview": "simplified", "steps": "false"}, 45)
        route = data["routes"][0]
        points = simplify_line(route["geometry"]["coordinates"], 0.000015)
        routes[key] = {
            "origin": origin, "destination": destination,
            "distanceKm": round(route["distance"] / 1000, 1),
            "minutes": round(route["duration"] / 60),
            "points": [[round(lon, 5), round(lat, 5)] for lon, lat in points],
        }
        print("Route", key, routes[key]["distanceKm"], "km", flush=True)

    relay_geo = {
        "westRelay": ["West ridge", 151.270, -33.365],
        "southRelay": ["Bouddi ridge", 151.385, -33.505],
        "eastRelay": ["Kincumber ridge", 151.410, -33.440],
        "centralRelay": ["Tuggerah ridge", 151.405, -33.310],
        "northRelay": ["Norah Head", 151.570, -33.282],
        "wyeeRelay": ["Wyee ridge", 151.465, -33.185],
    }
    relays = {}
    for key, (name, lon, lat) in relay_geo.items():
        relays[key] = {"name": name, "lat": lat, "lon": lon, "p": project(lon, lat),
                       "elevation": round(max(0, elevation(lat, lon)), 1)}

    packed_water = bytearray(math.ceil(len(water) / 8))
    for i, value in enumerate(water):
        if value:
            packed_water[i // 8] |= 1 << (i % 8)
    import base64
    output = {
        "attribution": "OSM contributors · AWS/Mapzen Terrain Tiles · OSRM illustrative routes",
        "bounds": BOUNDS, "center": CENTER, "kmScale": KM_SCALE,
        "verticalScale": VERTICAL_SCALE, "verticalExaggeration": 10,
        "grid": {"size": GRID, "heights": heights, "water": base64.b64encode(packed_water).decode()},
        "places": places, "relays": relays, "roads": roads, "routes": routes,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(output, separators=(",", ":")))
    print("Wrote", OUT, OUT.stat().st_size, "bytes", len(roads), "roads", len(polygons), "water polygons")


if __name__ == "__main__":
    main()
