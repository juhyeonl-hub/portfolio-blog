import {useMember} from './community';
import type {ReactNode} from 'react';
import {useLocale,LanguageSelect} from './locale';
import {AsbcMark} from './asbc-mark';
import {screenHash} from '../lib/navigation';
export default function ReaderShell({children}:{children:ReactNode}){const {t}=useLocale();const member=useMember();return <div className="shell reader-shell"><aside className="sidebar reader-sidebar" aria-label={t('주 메뉴')}><a className="brand" href="#/"><AsbcMark/><span>ASBC<small className="brand-full-name">Aion2 Steam<br/>Build Craft</small></span></a><nav>{[['home','메인'],['quick','빌드'],['rankers','랭킹'],['public-builds','공개 빌드'],['people','캐릭터 빌드 찾기'],['map','지도 & 수집'],['timers','콘텐츠 타이머'],['database','글로벌 데이터'],['updates','업데이트']].map(([id,name])=><a key={id} className={'nav'+(id==='public-builds'?' active':'')} href={screenHash(id)}>{t(name)}</a>)}</nav></aside><main className="reader-main"><header className="reader-toolbar"><a href="#/public-builds">{t('공개 빌드 목록')}</a><a href="#/account">{t(member?'계정':'로그인')}</a><LanguageSelect/></header>{children}</main></div>;}
