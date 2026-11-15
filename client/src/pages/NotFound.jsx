import React from 'react';
import { Link } from 'react-router-dom';
export default function NotFound(){return <main style={{maxWidth:720,margin:'120px auto',padding:32,color:'#e2e8f0'}}><h1>Page not found</h1><p>This address does not match a page in the reservation system.</p><Link to="/">Return to home</Link></main>;}
