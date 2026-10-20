import {useLocale} from './locale';
import {PRIVACY,PRIVACY_UPDATED} from '../lib/privacy-policy';

/** #privacy: the privacy policy in the selected language (text in lib/privacy-policy.ts). */
export function PrivacyPolicy(){
 const {locale}=useLocale();
 const policy=PRIVACY[locale];
 return <article className="card asbc-privacy" aria-labelledby="asbc-privacy-title">
  <h1 id="asbc-privacy-title">{policy.title}</h1>
  <p className="subtle">{policy.updated}: <time dateTime={PRIVACY_UPDATED}>{PRIVACY_UPDATED}</time></p>
  {policy.sections.map(section=><section key={section.heading}><h2>{section.heading}</h2>{section.paragraphs.map(text=><p key={text}>{text}</p>)}</section>)}
 </article>;
}
