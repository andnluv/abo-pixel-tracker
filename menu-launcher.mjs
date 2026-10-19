/**
 * Adds non-floating entry points to SillyTavern's extension (wand) menu and
 * extension settings area. Both launch the same existing tracker dialog.
 */
export const MENU_ENTRY_ID='abop-extension-menu-entry';
export const SETTINGS_ENTRY_ID='abop-extension-settings-entry';

/** @param {Document} doc @param {()=>void} openPanel */
export function mountExtensionLaunchers(doc,openPanel){
 const menu=doc.getElementById('extensionsMenu');
 const settings=doc.getElementById('extensions_settings2');
 if(menu&&!doc.getElementById(MENU_ENTRY_ID)){
  const entry=doc.createElement('div');
  entry.id=MENU_ENTRY_ID;
  entry.className='list-group-item flex-container flexGap5';
  entry.setAttribute('role','button');
  entry.setAttribute('tabindex','0');
  entry.setAttribute('aria-label','그날의 사정 열기');
  entry.title='그날의 사정 상태창·초기 분석·설정 열기';
  const glyph=doc.createElement('span');
  glyph.className='fa-solid fa-heart-pulse extensionsMenuExtensionButton';
  glyph.setAttribute('aria-hidden','true');
  const name=doc.createElement('span');
  name.textContent='그날의 사정';
  entry.append(glyph,name);
  entry.addEventListener('click',openPanel);
  entry.addEventListener('keydown',event=>{
   if(event.key!=='Enter'&&event.key!==' ')return;
   event.preventDefault();openPanel();
  });
  menu.appendChild(entry);
 }
 if(settings&&!doc.getElementById(SETTINGS_ENTRY_ID)){
  const section=doc.createElement('div');
  section.id=SETTINGS_ENTRY_ID;
  section.className='abop-extension-settings-entry';
  const heading=doc.createElement('strong');
  heading.textContent='그날의 사정';
  const description=doc.createElement('p');
  description.textContent='ABO 상태·초기 분석·주기·임신·취향·설정';
  const button=doc.createElement('button');
  button.type='button';
  button.className='menu_button abop-extension-settings-open';
  button.textContent='그날의 사정 열기';
  button.addEventListener('click',openPanel);
  section.append(heading,description,button);
  settings.appendChild(section);
 }
 return {menu:!!menu,settings:!!settings};
}
