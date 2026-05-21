import zipfile
import xml.etree.ElementTree as ET
import os

workspace_dir = r"c:\Users\German\OneDrive - Universidad Tecnológica de Bolívar\Escritorio\prueba\Antigravity\P_BD"

def parse_docx(docx_path):
    if not os.path.exists(docx_path):
        return "File does not exist"
    
    output = []
    try:
        with zipfile.ZipFile(docx_path) as z:
            # Let's inspect all xml files
            names = z.namelist()
            print("Files in docx zip:", names)
            
            xml_content = z.read('word/document.xml')
            root = ET.fromstring(xml_content)
            
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            
            def get_text(node):
                text_runs = []
                for run in node.findall('.//w:t', ns):
                    if run.text:
                        text_runs.append(run.text)
                return "".join(text_runs)
            
            # Let's write paragraphs
            body = root.find('w:body', ns)
            if body is not None:
                for child in body:
                    tag = child.tag.split('}')[-1]
                    if tag == 'p':
                        t = get_text(child)
                        if t.strip():
                            output.append(f"P: {t}")
                    elif tag == 'tbl':
                        output.append("\n--- TABLE START ---")
                        for r in child.findall('.//w:tr', ns):
                            row_cells = []
                            for c in r.findall('.//w:tc', ns):
                                cell_text = " ".join([get_text(p) for p in c.findall('.//w:p', ns)]).strip()
                                row_cells.append(cell_text)
                            output.append(" | ".join(row_cells))
                        output.append("--- TABLE END ---\n")
            
            # Let's also check if there are other parts, like header/footer or other document parts
            for name in names:
                if 'header' in name or 'footer' in name or 'document2' in name:
                    output.append(f"\n--- PART: {name} ---")
                    part_xml = z.read(name)
                    part_root = ET.fromstring(part_xml)
                    for child in part_root.iter():
                        tag = child.tag.split('}')[-1]
                        if tag == 't' and child.text:
                            output.append(child.text)
        
        return "\n".join(output)
    except Exception as e:
        return f"Error reading docx: {e}"

def parse_xlsx(xlsx_path):
    if not os.path.exists(xlsx_path):
        return "File does not exist"
    
    output = []
    try:
        with zipfile.ZipFile(xlsx_path) as z:
            names = z.namelist()
            
            # Read relationships
            rels = {}
            if 'xl/_rels/workbook.xml.rels' in names:
                rels_xml = z.read('xl/_rels/workbook.xml.rels')
                rels_root = ET.fromstring(rels_xml)
                ns_rel = {'rel': 'http://schemas.openxmlformats.org/package/2006/relationships'}
                for r in rels_root.findall('.//rel:Relationship', ns_rel):
                    rid = r.attrib.get('Id')
                    target = r.attrib.get('Target')
                    rels[rid] = f"xl/{target}" if not target.startswith('xl/') else target
            print("Relationships:", rels)
            
            # Read workbook (sheet names)
            workbook_xml = z.read('xl/workbook.xml')
            wb_root = ET.fromstring(workbook_xml)
            ns = {'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
                  'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
            
            sheets = []
            for sheet in wb_root.findall('.//main:sheet', ns):
                name = sheet.attrib.get('name')
                rid = sheet.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
                sheets.append((name, rid))
            print("Workbook sheets mapping:", sheets)
            
            # Read shared strings
            shared_strings = []
            if 'xl/sharedStrings.xml' in names:
                ss_xml = z.read('xl/sharedStrings.xml')
                ss_root = ET.fromstring(ss_xml)
                ns_ss = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
                for t in ss_root.findall('.//main:t', ns_ss):
                    shared_strings.append(t.text or '')
            
            # Read each sheet
            for name, rid in sheets:
                sheet_filename = rels.get(rid)
                if not sheet_filename or sheet_filename not in names:
                    output.append(f"Could not find file for sheet {name} with rid {rid} (target {sheet_filename})")
                    continue
                
                output.append(f"\n====================================================")
                output.append(f"SHEET: {name} (File: {sheet_filename})")
                output.append(f"====================================================")
                
                s_xml = z.read(sheet_filename)
                s_root = ET.fromstring(s_xml)
                ns_s = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
                
                rows = s_root.findall('.//main:row', ns_s)
                # Let's build a grid representation
                grid = {}
                max_row = 1
                max_col = 1
                
                def col_to_num(col_str):
                    num = 0
                    for c in col_str:
                        num = num * 26 + (ord(c) - ord('A') + 1)
                    return num
                
                def num_to_col(n):
                    string = ""
                    while n > 0:
                        n, remainder = divmod(n - 1, 26)
                        string = chr(65 + remainder) + string
                    return string

                for row in rows:
                    r_num = int(row.attrib.get('r'))
                    max_row = max(max_row, r_num)
                    for cell in row.findall('.//main:c', ns_s):
                        cell_ref = cell.attrib.get('r')
                        # Extract column letters from cell_ref
                        c_str = ''.join([c for c in cell_ref if c.isalpha()])
                        c_num = col_to_num(c_str)
                        max_col = max(max_col, c_num)
                        
                        cell_type = cell.attrib.get('t')
                        v_elem = cell.find('main:v', ns_s)
                        val = ""
                        if v_elem is not None:
                            val = v_elem.text
                            if cell_type == 's':
                                val = shared_strings[int(val)]
                        
                        grid[(r_num, c_num)] = val.strip().replace('\n', ' ')
                
                # Print the grid as a nice table
                for r in range(1, max_row + 1):
                    # Check if row is empty
                    row_vals = [grid.get((r, c), "") for c in range(1, max_col + 1)]
                    if any(row_vals):
                        # Format row
                        cells_formatted = [f"{num_to_col(c)}{r}: {grid.get((r,c), '')}" for c in range(1, max_col + 1) if grid.get((r,c), '')]
                        output.append(f"Row {r:02d} | " + "  |  ".join(cells_formatted))
            
        return "\n".join(output)
    except Exception as e:
        return f"Error reading xlsx: {e}"

if __name__ == "__main__":
    docx_file = os.path.join(workspace_dir, "Diccionario de datos_v2.docx")
    xlsx_file = os.path.join(workspace_dir, "Normalizacion_proyectoBD.xlsx")
    
    docx_text = parse_docx(docx_file)
    with open("diccionario_datos_proper.txt", "w", encoding="utf-8") as f:
        f.write(docx_text)
    print("Saved diccionario_datos_proper.txt")
        
    xlsx_text = parse_xlsx(xlsx_file)
    with open("normalizacion_datos_proper.txt", "w", encoding="utf-8") as f:
        f.write(xlsx_text)
    print("Saved normalizacion_datos_proper.txt")
