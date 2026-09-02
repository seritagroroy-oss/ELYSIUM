const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'components', 'Dashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');
let lines = content.split('\n');

// 1. Add imports
const importsToAdd = `const FaqModal                  = React.lazy(() => import('./modals/FaqModal'));
const AddSiteModal              = React.lazy(() => import('./modals/AddSiteModal'));
const PasteConfirmModal         = React.lazy(() => import('./modals/PasteConfirmModal'));
const DeleteSiteModal           = React.lazy(() => import('./modals/DeleteSiteModal'));
`;
lines.splice(68, 0, ...importsToAdd.split('\n'));
content = lines.join('\n');

function replaceBlock(content, startMarker, endMarker, newBlock) {
    const startIdx = content.indexOf(startMarker);
    if (startIdx === -1) return content;
    const endIdx = content.indexOf(endMarker, startIdx);
    if (endIdx === -1) return content;
    
    // Find the end of the line for endMarker
    let endOfLine = content.indexOf('\n', endIdx);
    if (endOfLine === -1) endOfLine = content.length;
    
    return content.substring(0, startIdx) + newBlock + content.substring(endOfLine + 1);
}

// 2. FaqModal
const faqReplacement = `              {/* ============ MODAL FAQ ============ */}
              <FaqModal showFaqModal={showFaqModal} setShowFaqModal={setShowFaqModal} />`;
content = replaceBlock(content, '{/* ============ MODAL FAQ (INLINED) ============ */}', 'document.body\n              )}', faqReplacement);

// 3. AddSiteModal
const addSiteReplacement = `        {/* Modal Ajout Site */}
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
        />`;
content = replaceBlock(content, '{/* Modal Ajout Site */}', 'handleCreateSite}>Créer</button>\n              </div>\n            </div>\n          </div>\n        )}', addSiteReplacement);

// 4. PasteConfirmModal
const pasteReplacement = `        {/* MODALE CONFIRMATION COLLAGE */}
        <PasteConfirmModal
          pasteConfirmModal={pasteConfirmModal}
          setPasteConfirmModal={setPasteConfirmModal}
          setClipboardWeek={setClipboardWeek}
          setSiteData={setSiteData}
          apiCall={apiCall}
          formatDateKey={formatDateKey}
          period={period}
          cycleStart={cycleStart}
        />`;
content = replaceBlock(content, '{/* MODALE CONFIRMATION COLLAGE */}', '<Check size={18} /> Coller\n                </button>\n              </div>\n            </div>\n          </div>\n        )}', pasteReplacement);

// 5. DeleteSiteModal
const deleteReplacement = `        {/* MODALE SUPPRIMER SITE */}
        <DeleteSiteModal
          showDeleteSiteModal={showDeleteSiteModal}
          setShowDeleteSiteModal={setShowDeleteSiteModal}
          siteContextMenu={siteContextMenu}
          handleDeleteSite={handleDeleteSite}
        />`;
content = replaceBlock(content, '{/* MODALE SUPPRIMER SITE */}', '<Trash size={16} /> Oui, Supprimer\n                </button>\n              </div>\n            </div>\n          </div>\n        )}', deleteReplacement);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Modified successfully.');
