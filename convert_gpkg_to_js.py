#!/usr/bin/env python3
"""
Convert GeoPackage files to JavaScript GeoJSON format for RSA Mining Map
This script converts GeoPackage (.gpkg) files to the JavaScript format used by the web map.
"""

import geopandas as gpd
import json
import os
import sys
from pathlib import Path


def convert_gpkg_to_js(gpkg_file, output_file, layer_name, variable_name):
    """
    Convert a GeoPackage file to JavaScript GeoJSON format
    
    Args:
        gpkg_file (str): Path to input GeoPackage file
        output_file (str): Path to output JavaScript file
        layer_name (str): Name for the layer in GeoJSON
        variable_name (str): JavaScript variable name
    """
    
    print(f'Converting {gpkg_file} to {output_file}...')
    
    # Read the GeoPackage file
    try:
        gdf = gpd.read_file(gpkg_file)
    except Exception as e:
        print(f'Error reading {gpkg_file}: {e}')
        return False
    
    # Ensure we're using WGS84 (EPSG:4326)
    if gdf.crs != 'EPSG:4326':
        print(f'Converting CRS from {gdf.crs} to EPSG:4326...')
        gdf = gdf.to_crs('EPSG:4326')
    
    # Map field names from GeoPackage to expected JavaScript format
    field_mapping = {
        'feature_id': 'fid',
        'LastUpdate': 'LastUpdate',
        'Status': 'Status', 
        'Code': 'Code',
        'Rights_Holder': 'Rights Holder',
        'Concession': 'Concession',
        'Resource_Targeted': 'Resource Targeted',
        'Area_ha': 'Area (ha)',
        'Table_code': 'Table code',
        'Primary_Resources': 'Primary Resources',
        'Additional_Resources': 'Additional Resources',
        'Comments': 'Comments',
        'On_Ripple': 'On Ripple'
    }
    
    # Rename columns to match expected format
    gdf_renamed = gdf.copy()
    for old_name, new_name in field_mapping.items():
        if old_name in gdf_renamed.columns:
            gdf_renamed = gdf_renamed.rename(columns={old_name: new_name})
    
    # Convert to GeoJSON
    geojson_data = gdf_renamed.to_json()
    geojson_dict = json.loads(geojson_data)
    
    # Set the layer name
    geojson_dict['name'] = layer_name
    
    # Set CRS to match existing format
    geojson_dict['crs'] = {
        'type': 'name',
        'properties': {
            'name': 'urn:ogc:def:crs:OGC:1.3:CRS84'
        }
    }
    
    # Convert to JavaScript format
    js_content = f'var {variable_name} = {json.dumps(geojson_dict, separators=(',', ':'))};'
    
    # Write to file
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(js_content)
        print(f'Successfully converted {gpkg_file} to {output_file}')
        print(f'Features: {len(geojson_dict["features"])}')
        return True
    except Exception as e:
        print(f'Error writing {output_file}: {e}')
        return False


def main():
    """Main function to handle command line arguments and conversion"""
    
    if len(sys.argv) < 2:
        print('Usage: python convert_gpkg_to_js.py <gpkg_file> [output_file] [layer_name] [variable_name]')
        print('Example: python convert_gpkg_to_js.py "Mining Right.gpkg" "data/MiningRight_19.js" "MiningRight_19" "json_MiningRight_19"')
        sys.exit(1)
    
    gpkg_file = sys.argv[1]
    
    # Check if input file exists
    if not os.path.exists(gpkg_file):
        print(f'Error: Input file {gpkg_file} not found')
        sys.exit(1)
    
    # Generate output filename if not provided
    if len(sys.argv) >= 3:
        output_file = sys.argv[2]
    else:
        # Default to data folder with .js extension
        base_name = Path(gpkg_file).stem
        output_file = f'data/{base_name}.js'
    
    # Generate layer name if not provided
    if len(sys.argv) >= 4:
        layer_name = sys.argv[3]
    else:
        layer_name = Path(gpkg_file).stem
    
    # Generate variable name if not provided
    if len(sys.argv) >= 5:
        variable_name = sys.argv[4]
    else:
        variable_name = f'json_{layer_name}'
    
    # Create data directory if it doesn't exist
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    # Convert the file
    success = convert_gpkg_to_js(gpkg_file, output_file, layer_name, variable_name)
    
    if success:
        print(f'Conversion completed successfully!')
        print(f'Output file: {output_file}')
        print(f'Variable name: {variable_name}')
        print(f'Layer name: {layer_name}')
    else:
        print('Conversion failed!')
        sys.exit(1)


if __name__ == '__main__':
    main()
