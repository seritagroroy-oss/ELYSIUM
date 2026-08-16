const fs = require('fs');
const path = require('path');

const dashFile = path.join(__dirname, 'Dashboard.jsx');
const compFile = path.join(__dirname, 'dashboard', 'SiteSelector.jsx');

let dashContent = fs.readFileSync(dashFile, 'utf8');
let dashLines = dashContent.split('\n');

let startIdx = -1;
let endIdx = -1;

for (let i = 0; i < dashLines.length; i++) {
  if (dashLines[i].includes('if (!activeSiteId) {') && dashLines[i+1]?.includes('return (')) {
    startIdx = i;
  }
  // The block ends at the closing brace of `if (!activeSiteId)` which is around line 3974
  if (startIdx !== -1 && i > startIdx && dashLines[i].includes('}') && dashLines[i-1]?.includes('</>') && dashLines[i-2]?.includes(')}')) {
    // Wait, let's just find the closing brace matching `if (!activeSiteId) {`
  }
}

// Instead of pure regex, let's just extract it by finding the boundaries
for (let i = 0; i < dashLines.length; i++) {
  if (dashLines[i] === '  if (!activeSiteId) {') {
    startIdx = i;
  }
  if (startIdx !== -1 && i > startIdx && dashLines[i].trim() === '}') {
    // Check if the previous lines match the end of the block
    if (dashLines[i-1].includes(');') && dashLines[i-2].includes('</>')) {
      endIdx = i;
      break;
    }
  }
}

if (startIdx !== -1 && endIdx !== -1) {
  const block = dashLines.slice(startIdx + 1, endIdx); // this is the return ( ... );

  const componentCode = `import React, { Suspense } from 'react';
import { Archive, Settings, Search, CheckCircle2, ChevronRight, LayoutGrid, Clock, Info, MoreVertical, X, Check, CalendarDays, Edit, Loader2 } from 'lucide-react';
import RenameSiteModal from '../modals/RenameSiteModal';
import PointageCalendarModal from '../modals/PointageCalendarModal';
import VerificationModal from '../modals/VerificationModal';

export default function SiteSelector({ state, actions }) {
  const {
    isArchiveMode, isPastMonth, isVerificationMode, sites, viewMode, showSiteSettings, siteSortOrder, cardDesign,
    searchTerm, activeSiteId, period, settingsMenuRef, getSafePeriod, currentMonthName, nextMonthName, nextYear,
    showRenameModalData, showFirstVisitModal, showAddSite, errorMsg, newSiteName, newSiteLocation, isSpecialSite, specialSiteType, customBehavior,
    showPublishModal, user, publishProgress, publishStatus,
    showNextMonthModal, initializing, initProgress, sitesToKeepHS, showKeepHSModal,
    siteContextMenu, loading, error, initializedSiteCount, totalSites, filteredSites, 
    handleTogglePeriodLock, lockedZones, formatAgentCount
  } = state;

  const {
    setViewMode, setShowSiteSettings, setSiteSortOrder, setCardDesign, setSearchTerm, setActiveSiteId, setActiveSiteName,
    setRenameModalData, executeRenameSite, handleFirstVisitNon, handleFirstVisitOui,
    setShowAddSite, setNewSiteName, setNewSiteLocation, setIsSpecialSite, setSpecialSiteType, setCustomBehavior, handleCreateSite,
    setShowPublishModal, setPublishPassword, handleConfirmPublish,
    setShowNextMonthModal, setShowKeepHSModal, handleNextMonth,
    setContextMenu, handleCardClick, toggleAllZonesLock, setShowVerificationModal, setShowCalendar
  } = actions;

${block.join('\n')}
}
`;
  
  if (!fs.existsSync(path.dirname(compFile))) {
    fs.mkdirSync(path.dirname(compFile), { recursive: true });
  }
  fs.writeFileSync(compFile, componentCode);

  // Replace block in Dashboard.jsx
  const replacement = `  if (!activeSiteId) {
    return (
      <SiteSelector 
        state={{
          isArchiveMode, isPastMonth, isVerificationMode, sites, viewMode, showSiteSettings, siteSortOrder, cardDesign,
          searchTerm, activeSiteId, period, settingsMenuRef, getSafePeriod, currentMonthName, nextMonthName, nextYear,
          showRenameModalData: renameModalData, showFirstVisitModal, showAddSite, errorMsg, newSiteName, newSiteLocation, isSpecialSite, specialSiteType, customBehavior,
          showPublishModal, user, publishProgress, publishStatus,
          showNextMonthModal, initializing, initProgress, sitesToKeepHS, showKeepHSModal,
          siteContextMenu, loading, error, initializedSiteCount, totalSites, filteredSites,
          handleTogglePeriodLock, lockedZones, formatAgentCount
        }}
        actions={{
          setViewMode, setShowSiteSettings, setSiteSortOrder, setCardDesign, setSearchTerm, setActiveSiteId, setActiveSiteName,
          setRenameModalData, executeRenameSite, handleFirstVisitNon, handleFirstVisitOui,
          setShowAddSite, setNewSiteName, setNewSiteLocation, setIsSpecialSite, setSpecialSiteType, setCustomBehavior, handleCreateSite,
          setShowPublishModal, setPublishPassword, handleConfirmPublish,
          setShowNextMonthModal, setShowKeepHSModal, handleNextMonth,
          setContextMenu, handleCardClick: (site) => {
            setActiveSiteId(site.id);
            setActiveSiteName(site.name);
          }, toggleAllZonesLock, setShowVerificationModal, setShowCalendar
        }}
      />
    );
  }`;
  
  dashLines.splice(startIdx, endIdx - startIdx + 1, replacement);
  fs.writeFileSync(dashFile, dashLines.join('\n'));
  console.log('Successfully created SiteSelector!');
} else {
  console.error('Could not find boundaries');
}
