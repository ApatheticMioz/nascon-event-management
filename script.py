# generate_docs.py
# This script searches the project directory for code files and appends them,
# in a formatted markdown, to an output file (default: CODE_DOCS.md).

import os
import json

# Directories to skip when walking
EXCLUDE_DIRS = {'.git', 'node_modules', 'venv', '__pycache__', '.idea', 'build', 'dist'}
# File extensions to treat as code
EXTENSIONS = {
    '.cpp', '.cc', '.cxx', '.hpp', '.hh', '.h', '.c', '.py', '.ipynb', '.r', '.R',
    '.cs', '.java', '.js', '.ts', '.jsx', '.tsx', '.sql'
}


def is_code_file(filename, this_script):
    # Skip the script itself
    if os.path.abspath(filename) == os.path.abspath(this_script):
        return False
    # Match extensions
    ext = os.path.splitext(filename)[1]
    return ext in EXTENSIONS


def extract_notebook_code(path):
    """Extract code cells from a Jupyter notebook as a single string."""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        code_cells = ["".join(cell.get('source', [])) for cell in data.get('cells', []) if cell.get('cell_type') == 'code']
        return "\n".join(code_cells)
    except Exception:
        return "<!-- Failed to parse notebook -->"


def append_code_to_md(path, out):
    ext = os.path.splitext(path)[1]
    out.write(f"## {path}\n\n")
    # Language tag for markdown fence
    lang = ext.lstrip('.').lower()
    if ext == '.ipynb':
        code = extract_notebook_code(path)
    else:
        try:
            with open(path, 'r', encoding='utf-8') as f:
                code = f.read()
        except Exception:
            code = f"<!-- Could not read {path} -->"
    out.write(f"```{lang}\n{code}\n```\n\n")


def main(output_file='CODE_DOCS.md'):
    this_script = __file__
    with open(output_file, 'w', encoding='utf-8') as out:
        for root, dirs, files in os.walk('.'):
            # prune unwanted dirs
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
            for fname in files:
                path = os.path.join(root, fname)
                if is_code_file(path, this_script):
                    append_code_to_md(path, out)
    print(f"All code files have been documented in {output_file}.")


if __name__ == '__main__':
    main()
