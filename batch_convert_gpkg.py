#!/usr/bin/env python3
"""
Batch convert multiple GeoPackage files to JavaScript GeoJSON format for RSA Mining Map
This script processes multiple .gpkg files and converts them to the JavaScript format used by the web map.
"""

import os
import glob
from pathlib import Path
from convert_gpkg_to_js import convert_gpkg_to_js


def batch_convert_gpkg_files(input_dir=r'C:\Users\User\Documents\Work\PTWC\RSA MIning Map\Data\Conversion Data', output_dir='data'):
    """
    Batch convert GeoPackage files to JavaScript format
    
    Args:
        input_dir (str): Directory containing GeoPackage files to convert
        output_dir (str): Output directory for converted files (default: 'data')
    """
    
    # Check if input directory exists
    if not os.path.exists(input_dir):
        print(f'Error: Input directory does not exist: {input_dir}')
        return
    
    # Find all GeoPackage files in the input directory
    gpkg_pattern = os.path.join(input_dir, '*.gpkg')
    gpkg_files = glob.glob(gpkg_pattern)
    
    if not gpkg_files:
        print(f'No GeoPackage files found in directory: {input_dir}')
        return
    
    print(f'Found {len(gpkg_files)} GeoPackage files to convert:')
    for file in gpkg_files:
        print(f'  - {file}')
    print()
    
    # Define mapping for common mining data types
    # This maps file names to expected output names and variable names
    file_mappings = {
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
    
    successful_conversions = []
    failed_conversions = []
    
    # Process each file
    for gpkg_file in gpkg_files:
        print(f'Processing: {gpkg_file}')
        
        # Get just the filename without path for mapping lookup
        filename = os.path.basename(gpkg_file)
        
        # Check if we have a predefined mapping for this file
        if filename in file_mappings:
            output_file, layer_name, variable_name = file_mappings[filename]
            output_path = os.path.join(output_dir, output_file)
        else:
            # Generate default names
            base_name = Path(filename).stem
            output_file = f'{base_name}.js'
            output_path = os.path.join(output_dir, output_file)
            layer_name = base_name
            variable_name = f'json_{base_name}'
        
        # Convert the file
        success = convert_gpkg_to_js(gpkg_file, output_path, layer_name, variable_name)
        
        if success:
            successful_conversions.append((gpkg_file, output_path))
        else:
            failed_conversions.append(gpkg_file)
        
        print()
    
    # Print summary
    print('=' * 60)
    print('CONVERSION SUMMARY')
    print('=' * 60)
    print(f'Total files processed: {len(gpkg_files)}')
    print(f'Successful conversions: {len(successful_conversions)}')
    print(f'Failed conversions: {len(failed_conversions)}')
    
    if successful_conversions:
        print('\nSuccessfully converted:')
        for input_file, output_file in successful_conversions:
            print(f'  {input_file} -> {output_file}')
    
    if failed_conversions:
        print('\nFailed conversions:')
        for file in failed_conversions:
            print(f'  {file}')
    
    print('\nNext steps:')
    print('1. Review the converted files in the data/ directory')
    print('2. Backup your original data files if needed')
    print('3. Replace the old .js files with the new ones')
    print('4. Refresh your web browser to see the updated map')


def main():
    """Main function"""
    import sys
    
    # Default input directory
    input_dir = r'C:\Users\User\Documents\Work\PTWC\RSA MIning Map\Data\Conversion Data'
    
    # Check for command line arguments
    if len(sys.argv) > 1:
        input_dir = sys.argv[1]
    
    if len(sys.argv) > 2:
        output_dir = sys.argv[2]
    else:
        output_dir = 'data'
    
    print('RSA Mining Map - GeoPackage to JavaScript Converter')
    print('=' * 50)
    print(f'Input directory: {input_dir}')
    print(f'Output directory: {output_dir}')
    print()
    
    # Run the batch conversion
    batch_convert_gpkg_files(input_dir, output_dir)


if __name__ == '__main__':
    main()
