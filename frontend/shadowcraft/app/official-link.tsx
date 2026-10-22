import type {AnchorHTMLAttributes} from 'react';
import {isOfficialUrl} from '../lib/official-url';
export default function OfficialLink(props:AnchorHTMLAttributes<HTMLAnchorElement>){return props.href&&isOfficialUrl(props.href)?<a {...props}/>:null;}
