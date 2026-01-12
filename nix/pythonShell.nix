{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  packages = with pkgs; [
    (python3.withPackages (ps: [
      ps.fastapi
      ps.uvicorn
      ps.python-multipart
      ps.pydantic
      ps.pydantic-settings
      ps.tinydb
      ps.litellm
      ps.markitdown
      ps.pdfminer-six
      ps.playwright
      ps.python-docx
      ps.python-dotenv
      ps.pytest
      ps.pytest-asyncio
      ps.pytest-cov
      ps.httpx
    ]))
    uv
  ];
  shellHook = ''
    # Optional: Auto-activate uv venv if .venv exists
    if [ -f .venv/bin/activate ]; then
      source .venv/bin/activate
    fi
  '';
}
