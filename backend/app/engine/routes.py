"""
Geospatial Logistics Routes and Coordinate Interpolation.
CBS3002 Information Security Project - Kaviselvaram & Aniesh S
"""

from typing import List, Tuple, Dict, Any


# Major Pharmaceutical Transit Corridor:
# Hub A: Genome Valley / Pharma City, Hyderabad (17.5186° N, 78.5833° E)
# Hub B: Electronics City Cold Logistics Depot, Bengaluru (12.8452° N, 77.6602° E)
# Hub C: Apollo Specialty Hospital, Chennai (13.0604° N, 80.2496° E)

DEFAULT_WAYPOINTS: List[Tuple[float, float, str]] = [
    (17.5186, 78.5833, "BioVax Manufacturing Plant, Hyderabad"),
    (17.3850, 78.4867, "Hyderabad Outer Ring Road Exit"),
    (16.7488, 77.9897, "Mahabubnagar Highway Checkpoint"),
    (15.8281, 78.0373, "Kurnool Regional Transit Depot"),
    (14.6819, 77.6006, "Anantapur Cold Logistics Station"),
    (13.6288, 77.5385, "Chikkaballapur Gateway"),
    (12.9716, 77.5946, "Bengaluru Central Distribution Hub"),
    (12.8452, 77.6602, "Electronics City ColdLogix Depot"),
    (12.8342, 77.8624, "Hosur Border Control"),
    (12.5266, 78.2148, "Krishnagiri Junction"),
    (12.9165, 79.1325, "Vellore Tollway Checkpoint"),
    (12.9800, 79.9700, "Sriperumbudur Industrial Corridor"),
    (13.0604, 80.2496, "Apollo Specialty Hospital Delivery Bay, Chennai")
]


def interpolate_route_position(progress_ratio: float, waypoints: List[Tuple[float, float, str]] = None) -> Tuple[float, float, str]:
    """
    Interpolates current vehicle coordinates along polyline route based on progress (0.0 to 1.0).
    """
    if waypoints is None:
        waypoints = DEFAULT_WAYPOINTS

    clamped_progress = max(0.0, min(1.0, progress_ratio))
    total_segments = len(waypoints) - 1
    
    scaled = clamped_progress * total_segments
    current_idx = int(scaled)
    fraction = scaled - current_idx

    if current_idx >= total_segments:
        lat, lon, label = waypoints[-1]
        return lat, lon, label

    lat1, lon1, label1 = waypoints[current_idx]
    lat2, lon2, label2 = waypoints[current_idx + 1]

    interp_lat = lat1 + (lat2 - lat1) * fraction
    interp_lon = lon1 + (lon2 - lon1) * fraction
    current_label = f"En route to {label2} (passed {label1})"

    return round(interp_lat, 6), round(interp_lon, 6), current_label
