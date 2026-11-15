import React,{createContext,useCallback,useContext,useEffect,useState} from 'react';
const LoadingActions=createContext(null);
const LoadingCount=createContext(0);
export function LoadingProvider({children}) {
  const [count,setCount]=useState(0);
  const begin=useCallback(()=>{let active=true;setCount(value=>value+1);return ()=>{if(active){active=false;setCount(value=>Math.max(0,value-1));}};},[]);
  return <LoadingActions.Provider value={begin}><LoadingCount.Provider value={count}>{children}</LoadingCount.Provider></LoadingActions.Provider>;
}
export function usePageLoading(loading){const begin=useContext(LoadingActions);useEffect(()=>{if(loading&&begin)return begin();},[loading,begin]);}
export function usePendingLoads(){return useContext(LoadingCount);}
