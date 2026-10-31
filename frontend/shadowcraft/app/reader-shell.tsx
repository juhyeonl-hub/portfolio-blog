import type {ReactNode} from 'react';
import {useLocale} from './locale';
import TopNav from './top-nav';

export default function ReaderShell({children,active='public-builds',privacy=false}:{children:ReactNode;active?:string;privacy?:boolean}){
 const {t}=useLocale();
 return <div className="shell portal-shell reader-shell"><TopNav active={active}/><main id="asbc-main" tabIndex={-1} className="reader-main"><div className="reader-content">{!privacy&&<nav className="reader-toolbar" aria-label={t('공개 빌드')}><a href="#/public-builds">{t('공개 빌드 목록')}</a></nav>}{children}</div></main></div>;
}
