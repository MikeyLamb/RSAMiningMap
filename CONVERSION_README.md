# GeoPackage to JavaScript Converter for RSA Mining Map

This directory contains Python scripts to convert GeoPackage (.gpkg) files to the JavaScript GeoJSON format used by the RSA Mining Map web application.

## Files

- `convert_gpkg_to_js.py` - Single file converter (also exposes `convert_gdf_to_js` for in-memory GeoDataFrames)
- `batch_convert_gpkg.py` - Converts `Mining Right.gpkg`, or splits combined RSA Mining Areas by `Status` (see below)
- `mining_js_outputs.py` - Shared mapping from QGIS-style `.gpkg` names to `data/*.js` layer and variable names
- `CONVERSION_README.md` - This documentation

## Prerequisites

You need Python with the following packages installed:
- `geopandas`
- `json` (built-in)
- `pathlib` (built-in)

Install geopandas if you don't have it:
```bash
pip install geopandas
```

## Usage

### Single File Conversion

Convert a single GeoPackage file:

```bash
python convert_gpkg_to_js.py "Mining Right.gpkg"
```

This will create `data/MiningRight.gpkg.js` with variable name `json_MiningRight.gpkg`.

You can specify custom output file, layer name, and variable name:

```bash
python convert_gpkg_to_js.py "Mining Right.gpkg" "data/MiningRight_19.js" "MiningRight_19" "json_MiningRight_19"
```

### Batch Conversion

Convert all GeoPackage files from the designated conversion directory:

```bash
python batch_convert_gpkg.py
```

This will automatically look for files in: `C:\Users\User\Documents\Work\PTWC\RSA MIning Map\Data\Conversion Data`

You can specify a different input directory:

```bash
python batch_convert_gpkg.py "C:\path\to\your\gpkg\files"
```

### Split combined RSA Mining Areas by Status (recommended)

If you maintain a single GeoPackage, `rsa_mining_file/RSA Mining Areas.gpkg`, with one layer named **RSA Mining Areas** and a **Status** attribute on each feature, you can regenerate all twelve concession `.js` files in `data/` in one step. You no longer need to split by status in QGIS, export separate `.gpkg` files, and run the batch script on each.

Default input is `rsa_mining_file/RSA Mining Areas.gpkg` next to the script; default output is the project `data/` folder.

```bash
python batch_convert_gpkg.py --rsa-mining-areas
```

Optional custom paths (input GeoPackage, then output directory):

```bash
python batch_convert_gpkg.py --rsa-mining-areas "D:\path\RSA Mining Areas.gpkg" "D:\path\RSAMiningMap\data"
```

**Status normalization:** Before grouping, each **Status** is normalized (Unicode NFKC, collapsed spaces, case-insensitive match to the known stems in the naming table). A few common spelling variants are mapped—for example ``Reconnaisance Permit`` → ``Reconnaissance Permit``—see ``STATUS_ALIASES_LOWER`` in `mining_js_outputs.py` to add more.

Each distinct normalized status must match a stem in the naming table (for example `Mining Right` maps to `MiningRight_19.js`, same as exporting `Mining Right.gpkg` from QGIS). Features with null or blank **Status** are skipped with a warning. Unknown status strings are skipped with a warning that lists the raw **Status** values in that group.

**Statuses absent from the GeoPackage:** By default, layer files for statuses with *no* rows are left unchanged on disk, so an old `ReconnaissancePermit_11.js` can still appear on the map after you remove all reconnaissance rows from the GeoPackage. The summary lists those untouched files. To overwrite them with empty feature collections (clearing the map for those layers), run:

```bash
python batch_convert_gpkg.py --rsa-mining-areas --write-all-layers
```

Optional paths work the same way as without the flag (paths are any arguments that are not `--rsa-mining-areas` or `--write-all-layers`).

## Field Mapping

The converter automatically maps GeoPackage field names to the expected JavaScript format:

| GeoPackage Field | JavaScript Field |
|------------------|------------------|
| `feature_id` | `fid` |
| `Rights_Holder` | `Rights Holder` |
| `Resource_Targeted` | `Resource Targeted` |
| `Area_ha` | `Area (ha)` |
| `Table_code` | `Table code` |
| `Primary_Resources` | `Primary Resources` |
| `Additional_Resources` | `Additional Resources` |
| `On_Ripple` | `On Ripple` |

## Output Format

The converted files will have the following structure:

```javascript
var json_LayerName = {
    "type": "FeatureCollection",
    "name": "LayerName",
    "crs": {
        "type": "name",
        "properties": {
            "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
        }
    },
    "features": [
        {
            "type": "Feature",
            "properties": {
                "fid": "100",
                "Status": "Mining Right",
                "Code": "WC 10132 MR",
                "Rights Holder": "Trans Hex",
                // ... other properties
            },
            "geometry": {
                "type": "MultiPolygon",
                "coordinates": [[[18.047018577962774, -31.508704200280761], ...]]
            }
        }
        // ... more features
    ]
};
```

## Updating the Map

After conversion:

1. **Backup existing files** (recommended):
   ```bash
   cp -r data data_backup
   ```

2. **Replace the old .js files** with the new converted ones in the `data/` directory

3. **Refresh your web browser** to see the updated map

## Troubleshooting

### Common Issues

1. **CRS Conversion**: The script automatically converts to WGS84 (EPSG:4326) if needed
2. **Field Names**: Make sure your GeoPackage has the expected field names
3. **File Permissions**: Ensure you have write permissions to the output directory

### Error Messages

- `"No such file or directory"`: Check that the input GeoPackage file exists
- `"Error reading file"`: The GeoPackage file may be corrupted or in an unsupported format
- `"Error writing file"`: Check file permissions and disk space

## File Naming Convention

The batch converter uses these predefined mappings:

| Input File | Output File | Layer Name | Variable Name |
|------------|-------------|------------|---------------|
| `Mining Right.gpkg` | `MiningRight_19.js` | `MiningRight_19` | `json_MiningRight_19` |
| `Mining Application.gpkg` | `MiningApplication_18.js` | `MiningApplication_18` | `json_MiningApplication_18` |
| `Prospecting Right.gpkg` | `ProspectingRight_17.js` | `ProspectingRight_17` | `json_ProspectingRight_17` |
| ... | ... | ... | ... |

## Example Workflow (QGIS split + batch)

1. **Create the conversion directory**:
   ```
   C:\Users\User\Documents\Work\PTWC\RSA MIning Map\Data\Conversion Data\
   ```

2. **Place your GeoPackage files** in the conversion directory (this keeps them out of GitHub)

3. **Run the batch converter**:
   ```bash
   python batch_convert_gpkg.py
   ```

4. **The script automatically replaces** matching files in the `data/` directory

5. **Test the map** by opening `index.html` in a web browser

6. **Deploy** the updated files to your web server

## Example Workflow (single combined GeoPackage)

1. Export or copy your combined layer to `rsa_mining_file/RSA Mining Areas.gpkg` (layer name **RSA Mining Areas**, with a **Status** column).

2. From the repository root, run:

   ```bash
   python batch_convert_gpkg.py --rsa-mining-areas
   ```

3. Open `index.html` in a browser and confirm the layers load as expected.

## Notes

- The converter preserves all geometry and attribute data
- Coordinate system is automatically converted to WGS84
- Null values are preserved as `null` in the JavaScript output
- The output format matches the existing map's expectations exactly
