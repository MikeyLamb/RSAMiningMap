#!/usr/bin/env python3
"""
Convert Mining Right.gpkg to JavaScript GeoJSON for RSA Mining Map.

By default reads ``Mining Right.gpkg`` from the Conversion Data folder and
overwrites ``data/MiningRight_19.js`` next to this script.

Use ``python batch_convert_gpkg.py --rsa-mining-areas`` to split
``rsa_mining_file/RSA Mining Areas.gpkg`` by ``Status`` and write all
``data/*_8.js`` … ``data/*_19.js`` files in one step.
"""

import os
import sys
from pathlib import Path

import geopandas as gpd
import pandas as pd

from convert_gpkg_to_js import convert_gdf_to_js, convert_gpkg_to_js
from mining_js_outputs import (
    CANONICAL_STATUS_STEMS,
    FILE_MAPPINGS,
    RSA_MINING_AREAS_GPKG_NAME,
    RSA_MINING_AREAS_LAYER,
    normalize_status_str,
)

SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_INPUT_DIR = Path(r'C:\Users\User\Documents\Work\PTWC\RSA MIning Map\Data\Conversion Data')
MINING_RIGHT_GPKG = 'Mining Right.gpkg'


def resolve_mining_right_gpkg(input_override=None):
    """
    Resolve path to Mining Right.gpkg.

    If input_override is a .gpkg file, use it. If it is a directory, look for
    Mining Right.gpkg inside it. Otherwise use DEFAULT_INPUT_DIR.
    """
    if input_override:
        p = Path(input_override).expanduser().resolve()
        if p.is_file() and p.suffix.lower() == '.gpkg':
            return p
        if p.is_dir():
            cand = p / MINING_RIGHT_GPKG
            if cand.is_file():
                return cand
            raise FileNotFoundError(
                f'Could not find "{MINING_RIGHT_GPKG}" in directory: {p}'
            )
        raise FileNotFoundError(f'Not a file or directory: {input_override}')

    cand = DEFAULT_INPUT_DIR / MINING_RIGHT_GPKG
    if cand.is_file():
        return cand
    raise FileNotFoundError(
        f'Could not find "{MINING_RIGHT_GPKG}" at: {cand}\n'
        f'Pass the path to the .gpkg file or the folder that contains it, e.g.:\n'
        f'  python batch_convert_gpkg.py "C:\\\\path\\\\to\\\\{MINING_RIGHT_GPKG}"'
    )


def split_rsa_mining_areas_to_data_js(
    gpkg_path=None, output_dir=None, write_all_layers=False
):
    """
    Read combined RSA Mining Areas GeoPackage, split by ``Status``, write ``data/*.js``.

    ``Status`` values are normalized (Unicode NFKC, collapsed whitespace, case-insensitive
    match to known stems, plus a few spelling aliases—see ``mining_js_outputs``).

    Args:
        gpkg_path: Path to ``RSA Mining Areas.gpkg``. Default: ``rsa_mining_file/`` next to this script.
        output_dir: Target directory for .js files. Default: project ``data/``.
        write_all_layers: If True, write an empty FeatureCollection for every known status
            that has no rows in the GeoPackage, so stale ``data/*.js`` files are cleared.

    Returns:
        True if all mapped statuses converted successfully; False if any failure or missing input.
    """
    gpkg_path = Path(
        gpkg_path or (SCRIPT_DIR / 'rsa_mining_file' / RSA_MINING_AREAS_GPKG_NAME)
    ).expanduser().resolve()
    output_dir = Path(output_dir or (SCRIPT_DIR / 'data')).expanduser().resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    if not gpkg_path.is_file():
        print(f'Error: GeoPackage not found: {gpkg_path}')
        return False

    print('RSA Mining Map - Split RSA Mining Areas by Status')
    print('=' * 50)
    print(f'Source: {gpkg_path}')
    print(f'Layer: {RSA_MINING_AREAS_LAYER!r}')
    print(f'Output directory: {output_dir}')
    if write_all_layers:
        print('Mode: --write-all-layers (empty .js for statuses absent from GeoPackage)')
    print()

    try:
        gdf = gpd.read_file(gpkg_path, layer=RSA_MINING_AREAS_LAYER)
    except Exception as e:
        print(f'Error reading layer {RSA_MINING_AREAS_LAYER!r} from {gpkg_path}: {e}')
        return False

    if 'Status' not in gdf.columns:
        print('Error: column "Status" not found in layer; cannot split.')
        return False

    status_series = gdf['Status']
    null_mask = status_series.isna() | (status_series.astype(str).str.strip() == '')
    null_count = int(null_mask.sum())
    if null_count:
        print(
            f'Warning: {null_count} feature(s) have null or blank Status; '
            'they are skipped (no .js file written for them).'
        )
        print()

    work = gdf.loc[~null_mask].copy()
    if work.empty:
        print('Error: no features with a non-blank Status remain after filtering.')
        return False

    def _row_stem(x):
        if pd.isna(x):
            return None
        return normalize_status_str(str(x).strip())

    work['_stem'] = work['Status'].map(_row_stem)
    blank_stem = work['_stem'].isna()
    blank_stem_count = int(blank_stem.sum())
    if blank_stem_count:
        print(
            f'Warning: {blank_stem_count} feature(s) have a Status that is empty after '
            'normalization; they are skipped.'
        )
        print()
    work = work.loc[~blank_stem].copy()
    if work.empty:
        print('Error: no features left after Status normalization.')
        return False

    successful = []
    failed = []
    written_stems = set()

    for stem, group in work.groupby('_stem', sort=True):
        key = f'{stem}.gpkg'
        label = f'{gpkg_path} [canonical status={stem!r}]'
        if key not in FILE_MAPPINGS:
            raw_vals = sorted(group['Status'].dropna().astype(str).unique())
            print(
                f'Warning: no FILE_MAPPINGS entry for {key!r}; skipped {len(group)} feature(s). '
                f'Raw Status value(s) in layer: {raw_vals}'
            )
            print()
            continue

        out_name, layer_name, variable_name = FILE_MAPPINGS[key]
        out_path = output_dir / out_name
        ok = convert_gdf_to_js(
            group,
            out_path,
            layer_name,
            variable_name,
            source_label=label,
        )
        print()
        if ok:
            successful.append((stem, out_path))
            written_stems.add(stem)
        else:
            failed.append(stem)

    empty_written = []
    if write_all_layers and not failed:
        empty_template = gdf.iloc[:0].copy()
        for stem in CANONICAL_STATUS_STEMS:
            if stem in written_stems:
                continue
            key = f'{stem}.gpkg'
            out_name, layer_name, variable_name = FILE_MAPPINGS[key]
            out_path = output_dir / out_name
            label = f'{gpkg_path} [empty layer for status={stem!r}]'
            ok = convert_gdf_to_js(
                empty_template.copy(),
                out_path,
                layer_name,
                variable_name,
                source_label=label,
            )
            print()
            if ok:
                written_stems.add(stem)
                empty_written.append((stem, out_path))
            else:
                failed.append(stem)

    print('=' * 60)
    print('SPLIT CONVERSION SUMMARY')
    print('=' * 60)
    print(f'Status groups written: {len(successful)}')
    print(f'Failed groups: {len(failed)}')

    if successful:
        print('\nSuccessfully converted:')
        for stem, out_path in successful:
            print(f'  {stem!r} -> {out_path}')

    if empty_written:
        print('\nWritten as empty (no features in GeoPackage for this status):')
        for stem, out_path in empty_written:
            print(f'  {stem!r} -> {out_path}')

    if failed:
        print('\nFailed:')
        for stem in failed:
            print(f'  {stem!r}')

    if not write_all_layers:
        untouched = [s for s in CANONICAL_STATUS_STEMS if s not in written_stems]
        if untouched:
            print(
                '\nNote: The GeoPackage had no features for these status types, so the '
                'matching data/*.js files were not modified (previous files kept if any):'
            )
            for s in untouched:
                js_name = FILE_MAPPINGS[f'{s}.gpkg'][0]
                print(f'  - {s!r} -> {js_name}')
            print(
                '\nTo clear stale layers on the map, run with --write-all-layers '
                '(writes an empty FeatureCollection for each missing status).'
            )

    if successful or empty_written:
        print('\nRefresh your web browser to see the updated map.')

    return not failed


def batch_convert_gpkg_files(gpkg_files, output_dir):
    """
    Convert the given GeoPackage files to JavaScript format in output_dir.

    Args:
        gpkg_files (list[str | Path]): GeoPackage paths to convert
        output_dir (str | Path): Output directory (e.g. project ``data`` folder)
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    gpkg_files = [Path(f) for f in gpkg_files]

    if not gpkg_files:
        print('No GeoPackage files to convert.')
        return

    print(f'Converting {len(gpkg_files)} GeoPackage file(s):')
    for file in gpkg_files:
        print(f'  - {file}')
    print()
    print(f'Output directory: {output_dir.resolve()}')
    print()

    successful_conversions = []
    failed_conversions = []

    for gpkg_file in gpkg_files:
        gpkg_file = str(gpkg_file)
        print(f'Processing: {gpkg_file}')

        filename = os.path.basename(gpkg_file)

        if filename in FILE_MAPPINGS:
            output_file, layer_name, variable_name = FILE_MAPPINGS[filename]
            output_path = os.path.join(output_dir, output_file)
        else:
            base_name = Path(filename).stem
            output_file = f'{base_name}.js'
            output_path = os.path.join(output_dir, output_file)
            layer_name = base_name
            variable_name = f'json_{base_name}'

        success = convert_gpkg_to_js(gpkg_file, output_path, layer_name, variable_name)

        if success:
            successful_conversions.append((gpkg_file, output_path))
        else:
            failed_conversions.append(gpkg_file)

        print()

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

    print('\nExisting output .js files in the output directory were overwritten.')
    print('Refresh your web browser to see the updated map.')


def main():
    """Convert Mining Right.gpkg or split RSA Mining Areas into the project data folder."""
    output_dir = SCRIPT_DIR / 'data'

    argv = sys.argv[1:]
    if '--rsa-mining-areas' in argv:
        write_all = '--write-all-layers' in argv
        argv = [
            a
            for a in argv
            if a not in ('--rsa-mining-areas', '--write-all-layers')
        ]
        gpkg_in = Path(argv[0]).expanduser().resolve() if len(argv) > 0 else None
        if len(argv) > 1:
            output_dir = Path(argv[1]).expanduser().resolve()
        ok = split_rsa_mining_areas_to_data_js(
            gpkg_path=gpkg_in,
            output_dir=output_dir,
            write_all_layers=write_all,
        )
        sys.exit(0 if ok else 1)

    input_override = sys.argv[1] if len(sys.argv) > 1 else None
    if len(sys.argv) > 2:
        output_dir = Path(sys.argv[2]).expanduser().resolve()

    try:
        mining_right = resolve_mining_right_gpkg(input_override)
    except FileNotFoundError as e:
        print(f'Error: {e}')
        sys.exit(1)

    print('RSA Mining Map - Mining Right GeoPackage to JavaScript')
    print('=' * 50)
    print(f'Source: {mining_right}')
    print(f'Output directory: {output_dir}')
    print()

    batch_convert_gpkg_files([mining_right], output_dir)


if __name__ == '__main__':
    main()
