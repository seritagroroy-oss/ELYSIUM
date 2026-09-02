import os

file_path = r'c:\laragon\www\pontage\frontend\src\components\Dashboard.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 1. Add imports
import_lines = [
    "const FaqModal                  = React.lazy(() => import('./modals/FaqModal'));\n",
    "const AddSiteModal              = React.lazy(() => import('./modals/AddSiteModal'));\n",
    "const PasteConfirmModal         = React.lazy(() => import('./modals/PasteConfirmModal'));\n",
    "const DeleteSiteModal           = React.lazy(() => import('./modals/DeleteSiteModal'));\n"
]
lines.insert(68, "".join(import_lines))

def get_block_bounds(lines_array, start_str, end_str, start_offset=0, end_offset=0):
    start_idx = -1
    for i in range(len(lines_array)):
        if start_str in lines_array[i]:
            start_idx = i
            break
    if start_idx == -1: return -1, -1

    end_idx = -1
    for i in range(start_idx, len(lines_array)):
        if end_str in lines_array[i]:
            end_idx = i
            break
            
    if end_idx == -1: return -1, -1
    return start_idx + start_offset, end_idx + end_offset

# Replace FaqModal
start, end = get_block_bounds(lines, "{/* ============ MODAL FAQ (INLINED) ============ */}", "document.body", 0, 2)
if start != -1:
    lines = lines[:start] + ["              {/* ============ MODAL FAQ ============ */}\n              <FaqModal showFaqModal={showFaqModal} setShowFaqModal={setShowFaqModal} />\n"] + lines[end+1:]

# Replace AddSiteModal
start, end = get_block_bounds(lines, "{/* Modal Ajout Site */}", "handleCreateSite}>Créer</button>", 0, 3)
if start != -1:
    add_site_replacement = """        {/* Modal Ajout Site */}
        <AddSiteModal
          showAddSite={showAddSite}
          setShowAddSite={setShowAddSite}
          newSiteName={newSiteName}
          setNewSiteName={setNewSiteName}
          newSiteLocation={newSiteLocation}
          setNewSiteLocation={setNewSiteLocation}
          isSpecialSite={isSpecialSite}
          setIsSpecialSite={setIsSpecialSite}
          specialSiteType={specialSiteType}
          setSpecialSiteType={setSpecialSiteType}
          customBehavior={customBehavior}
          setCustomBehavior={setCustomBehavior}
          handleCreateSite={handleCreateSite}
          errorMsg={errorMsg}
        />\n"""
    lines = lines[:start] + [add_site_replacement] + lines[end+1:]

# Replace PasteConfirmModal
start, end = get_block_bounds(lines, "{/* MODALE CONFIRMATION COLLAGE */}", "Coller", 0, 3)
if start != -1:
    paste_replacement = """        {/* MODALE CONFIRMATION COLLAGE */}
        <PasteConfirmModal
          pasteConfirmModal={pasteConfirmModal}
          setPasteConfirmModal={setPasteConfirmModal}
          setClipboardWeek={setClipboardWeek}
          setSiteData={setSiteData}
          apiCall={apiCall}
          formatDateKey={formatDateKey}
          period={period}
          cycleStart={cycleStart}
        />\n"""
    lines = lines[:start] + [paste_replacement] + lines[end+1:]

# Replace DeleteSiteModal
start, end = get_block_bounds(lines, "{/* MODALE SUPPRIMER SITE */}", "Oui, Supprimer", 0, 3)
if start != -1:
    delete_replacement = """        {/* MODALE SUPPRIMER SITE */}
        <DeleteSiteModal
          showDeleteSiteModal={showDeleteSiteModal}
          setShowDeleteSiteModal={setShowDeleteSiteModal}
          siteContextMenu={siteContextMenu}
          handleDeleteSite={handleDeleteSite}
        />\n"""
    lines = lines[:start] + [delete_replacement] + lines[end+1:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Dashboard.jsx modified successfully.")
