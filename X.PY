import os

# --- CONFIGURAÇÕES (Onde você define o que eu NÃO devo ler) ---
OUTPUT_FILE = "site.md"
IGNORE_DIRS = {
    ".git", "__pycache__", "node_modules", "venv", ".idea", ".vscode", 
    "dist", "build", "migrations", "static/img", "assets/images" # Adicione pastas de mídia aqui
}
IGNORE_FILES = {
    ".DS_Store", "package-lock.json", "yarn.lock", "poetry.lock", 
    OUTPUT_FILE, ".env", "db.sqlite3", "*.pyc", "*.png", "*.jpg", "*.jpeg", "*.ico"
}
MAX_FILE_SIZE_KB = 500  # Ignora arquivos maiores que 500KB (pra não estourar meu contexto)

def is_ignored(name, is_dir=False):
    if is_dir:
        return name in IGNORE_DIRS
    # Checagem simples de extensão e nome exato
    if name in IGNORE_FILES: return True
    if name.endswith(tuple([ext.replace('*', '') for ext in IGNORE_FILES if '*' in ext])): return True
    return False

def generate_tree(startpath):
    tree_str = "# Estrutura do Projeto\n\n```text\n"
    for root, dirs, files in os.walk(startpath):
        dirs[:] = [d for d in dirs if not is_ignored(d, is_dir=True)]
        level = root.replace(startpath, '').count(os.sep)
        indent = ' ' * 4 * (level)
        tree_str += f"{indent}{os.path.basename(root)}/\n"
        subindent = ' ' * 4 * (level + 1)
        for f in files:
            if not is_ignored(f):
                tree_str += f"{subindent}{f}\n"
    tree_str += "```\n\n"
    return tree_str

def get_file_content(filepath):
    try:
        if os.path.getsize(filepath) > MAX_FILE_SIZE_KB * 1024:
            return f"\n> [ARQUIVO IGNORADO: Muito grande (> {MAX_FILE_SIZE_KB}KB)]\n"
        
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
            ext = filepath.split('.')[-1] if '.' in filepath else "txt"
            return f"\n## Arquivo: `{filepath}`\n\n```{ext}\n{content}\n```\n"
    except Exception as e:
        return f"\n> [ERRO AO LER ARQUIVO: {e}]\n"

def main():
    full_output = ""
    root_dir = "."
    
    print("--- Gerando árvore ---")
    full_output += generate_tree(root_dir)
    
    print("--- Lendo arquivos ---")
    for root, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if not is_ignored(d, is_dir=True)]
        
        for file in files:
            if not is_ignored(file):
                filepath = os.path.join(root, file)
                print(f"Lendo: {filepath}")
                full_output += get_file_content(filepath)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(full_output)
    
    print(f"\n✅ Concluído! Arquivo '{OUTPUT_FILE}' gerado.")
    print("Agora pegue esse arquivo e jogue na minha cara.")

if __name__ == "__main__":
    main()