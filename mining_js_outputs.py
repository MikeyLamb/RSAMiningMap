"""
Maps GeoPackage basenames (as exported from QGIS) to map data/*.js outputs.

Also used when splitting combined ``RSA Mining Areas.gpkg`` by Status:
``Status`` values match the .gpkg stem, e.g. ``Mining Right`` → ``Mining Right.gpkg``.
"""

import unicodedata
from pathlib import Path

# Maps file names to (output_js, geojson_layer_name, js_variable_name)
FILE_MAPPINGS = {
    'Mining Right.gpkg': ('MiningRight_19.js', 'MiningRight_19', 'json_MiningRight_19'),
    'Mining Application.gpkg': ('MiningApplication_18.js', 'MiningApplication_18', 'json_MiningApplication_18'),
    'Prospecting Right.gpkg': ('ProspectingRight_17.js', 'ProspectingRight_17', 'json_ProspectingRight_17'),
    'Prospecting Application.gpkg': ('ProspectingApplication_16.js', 'ProspectingApplication_16', 'json_ProspectingApplication_16'),
    'Production Right.gpkg': ('ProductionRight_15.js', 'ProductionRight_15', 'json_ProductionRight_15'),
    'Production Application.gpkg': ('ProductionApplication_14.js', 'ProductionApplication_14', 'json_ProductionApplication_14'),
    'Exploration Right.gpkg': ('ExplorationRight_13.js', 'ExplorationRight_13', 'json_ExplorationRight_13'),
    'Exploration Application.gpkg': ('ExplorationApplication_12.js', 'ExplorationApplication_12', 'json_ExplorationApplication_12'),
    'Reconnaissance Permit.gpkg': ('ReconnaissancePermit_11.js', 'ReconnaissancePermit_11', 'json_ReconnaissancePermit_11'),
    'Application Refused.gpkg': ('ApplicationRefused_10.js', 'ApplicationRefused_10', 'json_ApplicationRefused_10'),
    'Prospecting Right Expired.gpkg': ('ProspectingRightExpired_9.js', 'ProspectingRightExpired_9', 'json_ProspectingRightExpired_9'),
    'Empty Concession.gpkg': ('EmptyConcession_8.js', 'EmptyConcession_8', 'json_EmptyConcession_8'),
}

RSA_MINING_AREAS_LAYER = 'RSA Mining Areas'
RSA_MINING_AREAS_GPKG_NAME = 'RSA Mining Areas.gpkg'

# Lowercase stem after NFKC + collapsed whitespace → canonical stem (must match FILE_MAPPINGS keys)
STEM_BY_LOWER = {Path(k).stem.lower(): Path(k).stem for k in FILE_MAPPINGS}

# Common spelling / wording variants from field edits or imports
STATUS_ALIASES_LOWER = {
    'reconnaisance permit': 'Reconnaissance Permit',
    'reconissance permit': 'Reconnaissance Permit',
    'reconnaissance permits': 'Reconnaissance Permit',
}

# Stable order for optional ``--write-all-layers`` empty outputs
CANONICAL_STATUS_STEMS = tuple(Path(k).stem for k in FILE_MAPPINGS.keys())


def normalize_status_str(value: str):
    """
    Map a raw ``Status`` string to the canonical stem used in ``FILE_MAPPINGS``
    (e.g. ``MINING RIGHT`` → ``Mining Right``).

    Returns ``None`` for blank input. Returns a non-matching trimmed string if
    unknown so the caller can warn and skip.
    """
    s = unicodedata.normalize('NFKC', value)
    s = ' '.join(s.split()).strip()
    if not s:
        return None
    lk = s.lower()
    if lk in STATUS_ALIASES_LOWER:
        return STATUS_ALIASES_LOWER[lk]
    if lk in STEM_BY_LOWER:
        return STEM_BY_LOWER[lk]
    return s
