{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  packages = with pkgs; [
    (python3.withPackages (ps: [
      ps.pytest
      ps.pytest-asyncio
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
