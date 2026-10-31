import {createRoot} from 'react-dom/client';
import Planner from './app/page';
import './app/globals.css';
import './app/portal-layout.css';
import './app/portal-refinement.css';
createRoot(document.getElementById('root')!).render(<Planner/>);
