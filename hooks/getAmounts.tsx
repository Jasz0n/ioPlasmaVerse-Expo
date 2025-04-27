
import {  ADDRESS_ZERO, defineChain, getContract, isAddress, NATIVE_TOKEN_ADDRESS, prepareContractCall, readContract, simulateTransaction } from "thirdweb";

import { getBalance } from "thirdweb/extensions/erc20";
import { getRpcClient, eth_getBalance } from "thirdweb/rpc";
import { ChainList as FullChainList } from './chain';
import { ethers } from "ethers";
import { client } from "@/constants/thirdweb";
import { UNISWAP_CONTRACTS2 } from "@/constants/types";
import { Token as Token2 } from "@/constants/currency";

// Define a simple Chain interface
interface Chain {
  name: string;
  chainId: number;
  decimals: number;
}
interface chainData {
  Name: string;
  Balance: string;
}
function sanitizeTableName(name: string): string {
  return name.replace(/[^a-z0-9_]/gi, '_').toLowerCase();
}
const extractChainList = (): Chain[] => {
  return FullChainList.map(chain => ({
    name: chain.nativeCurrency.name,
    chainId: chain.chainId,
    decimals: chain.nativeCurrency.decimals
  }));
}

// Get the simplified chain list
const ChainList: Chain[] = extractChainList();  
  const Chatt = "0xAc8B079756eD852c6ed7bEc178F158F474b0625b";
  export const ChattApp = getContract({
    address: Chatt,
    client,
    chain: defineChain(4689),
  });
  
const ProfileImage = "0x139929A597B91ea89F41026b65b281611890F13B";
export const AppMint = getContract({
  address: ProfileImage,
  client,
  chain: defineChain(4689),
});

export async function handleReadBallance(
    contractAddress: string,
    chainId: number,
    walletAddress: string
  ): Promise<{ Balance: string; Name: string; Symbol: string } | null> {
    // Define network based on chainId
    const NETWORK2 = defineChain(chainId);
  
    // Initialize contract
    const contract = getContract({
      address: contractAddress,
      client: client,
      chain: NETWORK2,
    });
  
    try {
      // Fetch balance details
      const tokenUri = await getBalance({ contract, address: walletAddress });
  
      if (tokenUri && tokenUri.displayValue && tokenUri.name && tokenUri.symbol) {
        return {
          Balance: tokenUri.displayValue,
          Name: tokenUri.name,
          Symbol: tokenUri.symbol,
        };
      } else {
        console.error("Invalid balance format:", tokenUri);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  
    return null; // Return null if no valid data was found
  }


  export async function handleReadBallaceNative(
    walletAddress: string,
    chainId: number
  ): Promise<chainData> {
    const NETWORK2 = defineChain(chainId);
  
    // Find the chain name from ChainList using chainId
    const chainData = ChainList.find((chain) => chain.chainId === chainId);
    const chainName = chainData ? chainData.name : "Default Name";
    const chainDecimals = chainData ? chainData.decimals : 18;
  
    try {
      // Fetch balance details
      const rpcRequest = getRpcClient({ client, chain: NETWORK2 });
      const balance = await eth_getBalance(rpcRequest, {
        address: walletAddress,
      });
  
      if (balance ) {
        const balanceInNativeUnits = (parseFloat(balance.toString()) / Math.pow(10, chainDecimals)).toFixed(chainDecimals);
        return {
          Balance: balanceInNativeUnits,
          Name: chainName, // Use the name from ChainList or the default
        };
      } else {
        console.error("Invalid balance format:", balance);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  
    return {Balance: "",
      Name: "",}; 
    }

  
    type BuyingStepDex = "Uniswapv2" | "Veldrome" | "UniswapV3Single" | "UniswapV3Multi" | "Quickswap"| "QuickswapMulti" | "WrappedContract";
      
      
      type LiquidityToken = {
        name: string;
        address: string;
        stable: boolean;
      };
    
      
    
      interface Token {
        contractAddress: string;
        decimals: number; 
      }
    
      
    
      type RouteVeldrome = {
        from: string;
        to: string;
        LiquidityToken: string;
        stable: boolean;
        factory: string;
      };
      
      type PairVeldrome = {
        token: string;
        hasPairWithA: boolean;
        hasPairWithB: boolean;
        stable: boolean;
      };
    
      
      
     
          
          export async function getAvailableFeeTiers(
           tokenA: string,
           tokenB: string,
           factory: string,
           chainId:number
         ): Promise<number[]> {
            const NETWORK = defineChain(chainId);
    
            const feeTiers =  [500,1500, 3000, 10000]; // Default fee tiers for Uniswap V3
            const validTiers: number[] = [];
         
           for (const fee of feeTiers) {
             const poolAddress = await readContract({
               contract: getContract({client,chain:NETWORK, address:factory}),
               method:
                 "function getPool(address, address, uint24) view returns (address)",
               params: [tokenA,tokenB,fee],
             });
             if (poolAddress && poolAddress !== ADDRESS_ZERO) {
               validTiers.push(fee);
             }
           }
         
           return validTiers;
         }
    
         export async function getAvailableLiquidity(
          tokenA: string,
          tokenB: string,
          factory: string,
          chainId: number
        ): Promise<string | undefined> {
          const NETWORK = defineChain(chainId);
          const chainData = Object.values(UNISWAP_CONTRACTS2).find(
            (data) => data.chainId === chainId
          );
        
          if (!chainData) {
            console.error(`Chain data not found for chainId: ${chainId}`);
            return undefined;
          }
        
          const tokens = [
            tokenA,
            chainData?.wrappedAddress, // WETH or equivalent
            chainData?.usdcAddress, // USDC or equivalent
          ];
        
          const feeTiers =  [500,1500, 3000, 10000]; // Default fee tiers for Uniswap V3
        
          // Function to fetch pair address for a given token pair and fee
          const getPairAddress = async (tokenX: string, tokenY: string, fee: number) => {
            try {
              const pairAddress = await readContract({
                contract: getContract({ client, chain: NETWORK, address: factory }),
                method:     "function getPool(address, address, uint24) view returns (address)"            ,
                params: [tokenX, tokenY, fee],
              });
              console.log("address",pairAddress)
              return pairAddress && pairAddress !== "0x0000000000000000000000000000000000000000"
                ? pairAddress
                : undefined;
            } catch (error) {
              console.error(
                `Error fetching pair for tokens (${tokenX}, ${tokenY}) with fee ${fee}:`,
                error
              );
              return undefined;
            }
          };
        
          // Iterate through tokens and fee tiers to find a valid pair address
          for (const fee of feeTiers) {
            for (const token of tokens) {
              const pairAddress = await getPairAddress(token, tokenB, fee);
              if (pairAddress) {
                console.log(`Valid pair found: ${pairAddress} for tokens (${token}, ${tokenB}) with fee ${fee}`);
                return pairAddress; // Return immediately if a valid pair is found
              }
            }
          }
        
          console.warn("No valid pair found for the provided tokens and fees.");
          return undefined; // Return undefined if no pair is found
        }
        
      
        
        
             
        const fetchPairAddress = async (
          factory: any,
          tokenA: string,
          tokenB: string,
          stable: boolean,
          veldromeFactory: string,
          chainId: number
        ): Promise<string> => {
          try {
           console.log(factory)
        
            const NETWORK = defineChain(chainId);
        
            const pairAddress = await readContract({
              contract: getContract({
                client,
                chain: NETWORK,
                address: veldromeFactory || "",
              }),
              method:
                "function getPool(address tokenA, address tokenB, bool stable) view returns (address)",
              params: [tokenA, tokenB, stable],
            });
        
            console.log(`Fetched pair address for ${tokenA} and ${tokenB} (stable: ${stable}):`, pairAddress);
            return pairAddress;
          } catch (error) {
            
            return ""; // Return empty string if an error occurs
          }
        };
        
          
          
         const findPairsForLiquidityTokens = async (
               liquidityTokens: LiquidityToken[],
               factory: any,
               tokenA: Token,
               tokenB: Token,
               WETH9: string,
               chainId: number
             ): Promise<any[]> => {
             
               const pairs: PairVeldrome[] = [];
              console.log(WETH9)
               for (const liquidityToken of liquidityTokens) {
                 if (!liquidityToken.address) {
                   console.warn(`Skipping liquidity token with missing address:`, liquidityToken);
                   continue;
                 }
                 
         
                   
                 const pairWithA = await fetchPairAddress(factory, tokenA.contractAddress || "", liquidityToken.address, liquidityToken.stable, factory.address, chainId);
                 const pairWithB = await fetchPairAddress(factory,tokenB.contractAddress || "", liquidityToken.address, liquidityToken.stable, factory.address, chainId);
             
                 if (pairWithA && pairWithB) {
                   pairs.push({
                     token: liquidityToken.address,
                     hasPairWithA: pairWithA !== "",
                     hasPairWithB: pairWithB !== "",
                     stable: liquidityToken.stable,
                   });
             
                 }
               }
             
               const commonPairs = pairs.filter((pair) => pair.hasPairWithA && pair.hasPairWithB);
             
               return commonPairs;
             };
             
             
         
             
             const buildRoutes = (
               commonPairs: PairVeldrome[],
               tokenA: Token,
               tokenB: Token,
               WETH9: string,
               factory: string
             ): RouteVeldrome[] => {
               const routes: RouteVeldrome[] = [];
               console.log(WETH9)

               for (const pair of commonPairs) {
                 // Ensure tokenA is the start or tokenB is the destination
                 
                 routes.push(
                   {
                     from: tokenA.contractAddress || "",
                     to: tokenB.contractAddress || "",
                     LiquidityToken: pair.token,
                     stable: pair.stable,
                     factory: factory,
                   }
                 );
               }
             
               return routes;
             };
             
             
             
             const calculateBestAmountOut = async (
               routes: RouteVeldrome[],
               amountIn2: bigint,
               routerContract: any,
               tokenA: Token,
               tokenB: Token,
               veldromeFactory: string
             ): Promise<{ bestAmountOut: bigint; bestTupleRoute: (readonly [string, string, boolean, string])[] | null }> => {
               let bestAmountOut: bigint = BigInt(0);
               let bestTupleRoute: (readonly [string, string, boolean, string])[] | null = null;
             
             
               for (const route of routes) {
                 try {       
                   const tupleRouteTwoHop = [
                     [route.from, route.LiquidityToken , route.stable, route.factory] as const,
                     [route.LiquidityToken, route.to, route.stable, route.factory] as const,
                   ];
                   const path2Hop = [
                    {
                      from: tokenA?.contractAddress|| "",
                      to: route.LiquidityToken,
                      stable: true,
                      factory: veldromeFactory || "", 
                    },
                    {
                      from: route.LiquidityToken,
                      to: tokenB?.contractAddress || "",
                      stable: true,
                      factory: veldromeFactory || "", 
                    }
                  ]
             
                   const amountsOutTwoHop = await readContract({
                     contract: routerContract,
                     method: 
                     "function getAmountsOut(uint256 amountIn, (address from, address to, bool stable, address factory)[] routes) view returns (uint256[] amounts)",
                     params: [amountIn2, path2Hop],
                   });
             
                   const lastAmountOutTwoHop = BigInt(amountsOutTwoHop[amountsOutTwoHop.length - 1]);
             
                   const tupleRouteSingleHop = [
                     [route.from, route.to, route.stable, veldromeFactory] as const,
                   ];
                   const path2 = [
                    {
                      from: tokenA?.contractAddress || "",
                      to: tokenB?.contractAddress || "",
                      stable: true,
                      factory: veldromeFactory || "", // Providing a fallback for veldromeFactory
                    }
                  ]
                   // Query the router contract for the output amount along the single-hop route
                   const amountsOutSingleHop = await readContract({
                     contract: routerContract,
                     method:
                     "function getAmountsOut(uint256 amountIn, (address from, address to, bool stable, address factory)[] routes) view returns (uint256[] amounts)",
                     params: [amountIn2, path2],
                   });
             
                   const lastAmountOutSingleHop = BigInt(amountsOutSingleHop[amountsOutSingleHop.length - 1]);
             
                   // Compare and update the best route and amountOut
                   if (lastAmountOutTwoHop > bestAmountOut) {
                     bestAmountOut = lastAmountOutTwoHop;
                     bestTupleRoute = tupleRouteTwoHop;
                   }
             
                   if (lastAmountOutSingleHop > bestAmountOut) {
                     bestAmountOut = lastAmountOutSingleHop;
                     bestTupleRoute = tupleRouteSingleHop;
                   }
                 } catch (error) {
                 }
               }
             
               if (!bestTupleRoute) {
                throw new Error("Unable to find a valid route with the given parameters.");
               }
               return { bestAmountOut, bestTupleRoute };
             };
             
             
             
             
            
         
         const calculateAmountOutVeldrome = async (inputValue: bigint, tokenA: Token, tokenB: Token, chainId: number, chainData: any ): Promise<{bestAmountOut:bigint, Dex:string, routerAddress: string, route: any,  factory: string}> => {
            
           
            if (!chainData) return {bestAmountOut: 0n, Dex: "", routerAddress:"", route:"", factory:""}; // Return fallback value
            const WETH9 = chainData.wrappedAddress;
            const veldromeFactory = chainData.veldromeFactory;
            const veldromeRouter = chainData.veldromeRouter;
            const liquidityTokens = chainData.liquidityTokens;
            const NETWORK = defineChain(chainId);
    
           
         
           try {
             const routerContract = getContract({ address: veldromeRouter, client, chain: NETWORK });
             const factory = getContract({ address: veldromeFactory, client, chain: NETWORK });
    
             // Find common pairs dynamically
             const commonPairs = await findPairsForLiquidityTokens( liquidityTokens, factory, tokenA, tokenB,WETH9,chainId);
             if (!commonPairs.length) {
               throw new Error("No common liquidity tokens found.");
             }
    
             // Build routes dynamically
             const routes = buildRoutes( commonPairs,tokenA, tokenB,WETH9, factory.address);
         
             // Calculate the best amount out
             const { bestAmountOut, bestTupleRoute } = await calculateBestAmountOut(routes, inputValue, routerContract,tokenA, tokenB,factory.address);
            
             return {bestAmountOut: bestAmountOut, Dex: "veldrome", routerAddress:veldromeRouter, route: bestTupleRoute, factory:veldromeFactory};
           } catch (error) {
             return {bestAmountOut: 0n, Dex: "", routerAddress:"", route:"", factory:""}; // Fallback value
           }
         };
         
         
         
             
         
         
         
         const calculateAmountInVeldrome = async (outputValue: bigint, tokenA: Token, tokenB: Token, chainId: number, chainData: any): Promise<{bestAmountOut:bigint, Dex:string, routerAddress: string, route: any, factory:string}> => {
            
           
             
             if (!tokenA || !tokenB ) {
              return{bestAmountOut: 0n, Dex: "", routerAddress:"", route:"", factory:""}; // Return fallback value
            }
            if (!chainData) return {bestAmountOut: 0n, Dex: "", routerAddress:"", route:"", factory:""}; // Return fallback value
            const WETH9 = chainData.wrappedToken;
            const veldromeFactory = chainData.veldromeFactory;
            const veldromeRouter = chainData.veldromeRouter;
            const liquidityTokens = chainData.liquidityTokens;
            const NETWORK = defineChain(chainId);
    
             const tolerance = 0.015; // 1.5% tolerance
           
             try {
               const routerContract = getContract({ address: veldromeRouter, client, chain: NETWORK });
               const factory = getContract({ address: veldromeFactory, client, chain: NETWORK });
           
               
           
           
               // Step 1: Find common pairs dynamically
               const commonPairs = await findPairsForLiquidityTokens(liquidityTokens, factory, tokenA, tokenB,WETH9, chainId);
           
               if (!commonPairs.length) {
                 throw new Error("No common liquidity tokens found.");
               }
           
               const routes = buildRoutes(commonPairs, tokenA, tokenB, WETH9,factory.address);
           
               // Step 2: Use a default value to find the best route and amount out
               const defaultAmountIn = BigInt(1 * 10 ** tokenA.decimals);
               const { bestAmountOut, bestTupleRoute } = await calculateBestAmountOut(routes, defaultAmountIn, routerContract, tokenA,tokenB, factory.address);
           
               if (!bestTupleRoute) {
                 throw new Error("No best route found.");
               }
           
           
               // Step 3: Use ratio to estimate the input for desired output
               let estimatedAmountIn = (defaultAmountIn * outputValue) / bestAmountOut;
               let refinedAmountOut = BigInt(0);
           
               // Step 4: Refine the estimation iteratively
               while (true) {
                 const amountsOut = await readContract({
                   contract: routerContract,
                   method: "function getAmountsOut(uint256,(address,address,bool,address)[]) view returns (uint256[])",
                   params: [estimatedAmountIn, 
                     bestTupleRoute
                   ],
                 });
           
                 refinedAmountOut = BigInt(amountsOut[amountsOut.length - 1]);
           
                 const difference = Math.abs(Number(refinedAmountOut - outputValue)) / Number(outputValue);
                 if (difference <= tolerance) {
                   break; // Break if the refined amountOut is within the tolerance range
                 }
           
                 estimatedAmountIn = (estimatedAmountIn * outputValue) / refinedAmountOut;
               }
           
               return {bestAmountOut: estimatedAmountIn, Dex: "Veldrome", routerAddress: veldromeRouter, route:bestTupleRoute , factory:veldromeFactory}; // Return readable amountIn
             } catch (error) {
               console.error("Error calculating amount in:", error);
               return {bestAmountOut: 0n, Dex: "", routerAddress:"", route:"", factory:""}; // Fallback value
             }
           };
      
           
              
      
      
      
          const findPairsForLiquidityTokensV3 = async (factory: any, tokenA: Token, tokenB: Token, chainId: number, chainData: any): Promise<`0x${string}`[]> => {
            
         const liquidityTokens = chainData.liquidityTokens;
            const pairs: `0x${string}`[] = [];
            
            const getPath2 = async (tokenAddressA: string, liquidityToken: any, tokenAddressB: string) => {
              const feesForAtoL = await getAvailableFeeTiers(tokenAddressA, liquidityToken.address, factory, chainId);
              const feesForLtoB = await getAvailableFeeTiers(liquidityToken.address, tokenAddressB, factory, chainId);
              
              const paths: `0x${string}`[] = [];
              
              for (const feeAtoL of feesForAtoL) {
                for (const feeLtoB of feesForLtoB) {
                  if (liquidityToken.address !== tokenAddressB || tokenAddressA) {
      
                  const path2: `0x${string}` = ethers.utils.solidityPack(
                    ["address", "uint24", "address", "uint24", "address"],
                    [tokenAddressA, feeAtoL, liquidityToken.address, feeLtoB, tokenAddressB]
                  ) as `0x${string}`;
                  
                  paths.push(path2);
                }
              }
            }
              return paths;
            };
            
            const getPath3 = async (
              tokenAddressA: string,
              liquidityToken: any,
              otherLiquidityToken: any,
              tokenAddressB: string
            ) => {
              // Fetch available fee tiers
              const feesForLtoOtherL = await getAvailableFeeTiers(
                liquidityToken.address,
                otherLiquidityToken.address,
                factory,
                chainId
              );
            
              const feesForOtherLtoB = await getAvailableFeeTiers(
                otherLiquidityToken.address,
                tokenAddressB,
                factory,
                chainId
              );
            
              const feesForOtherAtoL = await getAvailableFeeTiers(
                tokenAddressA,
                liquidityToken.address,
                factory,
                chainId
              );
            
              const paths: `0x${string}`[] = [];
            
              // Loop through the fees for each combination
              for (const feeLtoOtherL of feesForLtoOtherL) {
                for (const feeOtherLtoB of feesForOtherLtoB) {
                  for (const feeOtherAtoL of feesForOtherAtoL) {
                    
                    // Skip if tokenAddressA or tokenAddressB is the same as liquidityToken or otherLiquidityToken
                    if (
                      tokenAddressA === liquidityToken.address ||
                      tokenAddressA === otherLiquidityToken.address ||
                      tokenAddressB === liquidityToken.address ||
                      tokenAddressB === otherLiquidityToken.address
                    ) {
                      continue; // Skip this iteration if it's an invalid swap
                    }
            
                    // Ensure that no liquidity token is used twice in the path (no repetition of the same address)
                    if (tokenAddressA !== liquidityToken.address  && tokenAddressA !== otherLiquidityToken.address) {
                      // Create path using solidity pack
                      const path3: `0x${string}` = ethers.utils.solidityPack(
                        [
                          "address", "uint24", "address", "uint24", "address", "uint24", "address"
                        ],
                        [
                          tokenAddressA,
                          feeOtherAtoL,
                          liquidityToken.address,
                          feeLtoOtherL,
                          otherLiquidityToken.address,
                          feeOtherLtoB,
                          tokenAddressB,
                        ]
                      ) as `0x${string}`;
            
                      paths.push(path3); // Add valid path to the array
                    }
                  }
                }
              }
            
              return paths;
            };
            
      
            
            const promises = liquidityTokens.map(async (liquidityToken: LiquidityToken) => {
              if (!liquidityToken.address) {
                return null;
              }
          
              
          
              const path2 = await getPath2(tokenA.contractAddress, liquidityToken, tokenB.contractAddress);
              pairs.push(...path2);
          
              const otherPromises = liquidityTokens.map(async (otherLiquidityToken: LiquidityToken) => {
                if (
                  liquidityToken.address !== tokenA.contractAddress &&
                  liquidityToken.address !== tokenB.contractAddress &&
                  otherLiquidityToken.address !== tokenA.contractAddress &&
                  otherLiquidityToken.address !== tokenB.contractAddress
                ) {
                  const path3 = await getPath3(
                    tokenA.contractAddress,
                    liquidityToken,
                    otherLiquidityToken,
                    tokenB.contractAddress
                  );
                  pairs.push(...path3);
                }
              });
          
              await Promise.all(otherPromises);
            });
          
            await Promise.all(promises);
          
            return pairs;
          };
      
          const findPairsForLiquidityTokensV3Input = async (factory: any,tokenA: Token, tokenB: Token, chainId: number, chainData: any): Promise<`0x${string}`[]> => {
    
         const liquidityTokens: any = chainData.liquidityTokens;
            const pairs: `0x${string}`[] = [];
            const WETH9: string = chainData.wrappedAddress;
    
            const getPath2 = async (tokenAddressA: string, liquidityToken: any, tokenAddressB: string) => {
              const feesForAtoL = await getAvailableFeeTiers(tokenAddressB, liquidityToken.address, factory, chainId);
              const feesForLtoB = await getAvailableFeeTiers(liquidityToken.address, tokenAddressA, factory, chainId);
              
              const paths: `0x${string}`[] = [];
              
              for (const feeAtoL of feesForAtoL) {
                for (const feeLtoB of feesForLtoB) {
                  if (liquidityToken.address !== tokenAddressB || tokenAddressA) {
      
                  const path2: `0x${string}` = ethers.utils.solidityPack(
                    ["address", "uint24", "address", "uint24", "address"],
                    [tokenAddressB,feeAtoL , liquidityToken.address ,feeLtoB , tokenAddressA]
                  ) as `0x${string}`;
                  
                  paths.push(path2);
                }
              }
              }
              return paths;
            };
            
            const getPath3 = async (
              tokenAddressA: string,
              liquidityToken: any,
              otherLiquidityToken: any,
              tokenAddressB: string
            ) => {
               
        
              const feesForLtoOtherL = await getAvailableFeeTiers(
                liquidityToken.address,
                otherLiquidityToken.address,
                factory,
                chainId
              );
              const feesForOtherLtoB = await getAvailableFeeTiers(
                otherLiquidityToken.address,
                tokenAddressA,
                factory,
                chainId
              );
              const feesForOtherAtoL = await getAvailableFeeTiers(tokenAddressB, liquidityToken.address, factory, chainId);
              
              const paths: `0x${string}`[] = [];
              
              for (const feeLtoOtherL of feesForLtoOtherL) {
                for (const feeOtherLtoB of feesForOtherLtoB) {
                  for (const feeOtherAtoL of feesForOtherAtoL) {
                    if (tokenAddressA === liquidityToken.address || tokenAddressA === otherLiquidityToken.address) {
                      continue; // Skip this iteration if it's an invalid swap
                    }
            
                    // Skip if tokenAddressB is the same as liquidityToken address or otherLiquidityToken address
                    if (tokenAddressB === liquidityToken.address || tokenAddressB === otherLiquidityToken.address) {
                      continue; // Skip this iteration if it's an invalid swap
                    }
      
                    const path3: `0x${string}` = ethers.utils.solidityPack(
                    [
                      "address",
                      "uint24",
                      "address",
                      "uint24",
                      "address",
                      "uint24",
                      "address",
                    ],
                    [
                      tokenAddressB,
                      feeOtherAtoL,
                      liquidityToken.address,
                      feeLtoOtherL,
                      otherLiquidityToken.address,
                      feeOtherLtoB,
                      tokenAddressA,
                    ]
                  ) as `0x${string}`;
                  
                  paths.push(path3);
                }
              }
            }
         
              return paths;
            };
      
            
            const promises = liquidityTokens.map(async (liquidityToken: any) => {
              if (!liquidityToken.address) {
                return null;
              }
          
              
          
              const path2 = await getPath2(tokenA.contractAddress, liquidityToken, tokenB.contractAddress);
              pairs.push(...path2);
          
              const otherPromises = liquidityTokens.map(async (otherLiquidityToken: any) => {
                if (WETH9 !== tokenA.contractAddress || tokenB.contractAddress) {
                  const path3 = await getPath3(tokenA.contractAddress, liquidityToken, otherLiquidityToken, tokenB.contractAddress);
                  pairs.push(...path3);
                }
              });
          
              await Promise.all(otherPromises);
            });
          
            await Promise.all(promises);
          
            return pairs;
          };
            
         
          const calculateBestAmountOutV3 = async (
            routes: `0x${string}`[],
            amountIn2: bigint,
            quouter: string,
            chainId: number
          ): Promise<{ bestAmountOut: bigint; bestTupleRoute: `0x${string}`}> => {
            let bestAmountOut: bigint = BigInt(0);
            let bestTupleRoute: `0x${string}` = "0x";
            const NETWORK = defineChain(chainId);
    
            const results = await Promise.all(
              routes.map(async (route) => {
                try {
                   const transaction = prepareContractCall({
                            contract: getContract({ client, chain: NETWORK, address: quouter }),
                            method: 
                            "function quoteExactInput(bytes path, uint256 amountIn) returns (uint256 amountOut, uint160[] sqrtPriceX96AfterList, uint32[] initializedTicksCrossedList, uint256 gasEstimate)",
                            params: [route,amountIn2],
                          });
                      // Simulate the transaction
                      const simulation = await simulateTransaction({
                        transaction,
                       });
                  return { route, amountIn: simulation[0] }; // Return the route and amount
                } catch (error) {
                  return null; // Skip failed routes
                }
              })
            );
          
            // Filter out failed routes and find the best result
            results.forEach((result) => {
              if (result && result.amountIn > bestAmountOut) {
                bestAmountOut = result.amountIn;
                bestTupleRoute = result.route;
              }
            });
          
            return { bestAmountOut: bestAmountOut, bestTupleRoute };
          };
      
          const calculateBestAmountInV3 = async (
            routes: `0x${string}`[],
            amountIn: bigint,
            quoter: string,
            chainId: number
          ): Promise<{ bestAmountOut: bigint; bestTupleRoute: `0x${string}` }> => {
            let bestAmountIn: bigint = 999999999999999999999999999999999999999999n; // Start with the largest possible value
            let bestTupleRoute: `0x${string}` = "0x";
            const NETWORK = defineChain(chainId);
    
            const results = await Promise.all(
              routes.map(async (route) => {
                try {
                  const transaction = prepareContractCall({
                    contract: getContract({ client, chain: NETWORK, address: quoter }),
                    method: 
                    "function quoteExactOutput(bytes path, uint256 amountOut) returns (uint256 amountIn, uint160[] sqrtPriceX96AfterList, uint32[] initializedTicksCrossedList, uint256 gasEstimate)",
                    params: [route,amountIn],
                  });
              const simulation = await simulateTransaction({
                transaction,
               });
               
      
                  return { route, amountIn: simulation[0] }; // Return the route and amount
                } catch (error) {
                  return null; // Skip failed routes
                }
              })
            );
          
            // Filter out failed routes and find the best result
            results.forEach((result) => {
              if (result && result.amountIn < bestAmountIn) {
                bestAmountIn = result.amountIn;
                bestTupleRoute = result.route;
              }
            });
            return { bestAmountOut: bestAmountIn, bestTupleRoute };
          };
          
          
          
      
                                const calculateAmountOutV3 = async (inputValue: bigint,
                                    tokenA: Token,
                                tokenB:Token,
                                chainId: number,
                                chainData: any
                                ): Promise<{bestAmountOut:bigint, Dex:string, routerAddress: string, route: any, factory: string}> => {
                                    let UniswapV3: any[];
                
                                    UniswapV3 = chainData.UniswapV3 || []
    
                                  try {                                
                                const factoryResults = await Promise.all(
                                      UniswapV3.map(async (factory) => {
                                        try {
                                                                          
          
                                          const commonPairs = await findPairsForLiquidityTokensV3( factory.factory, tokenA,tokenB,chainId, chainData);
                                          
                                      
                                            const { bestAmountOut, bestTupleRoute } = await calculateBestAmountOutV3(commonPairs, inputValue, factory.quoterV2 || "", chainId);
                                      
                                          return { factoryName: factory.name, bestAmountOut, routerAddress: factory.router, factoryAddress: factory.factory, bestTupleRoute, factory: factory.factory };
                                        } catch (error) {
                                          return null;
                                        }
                                      })
                                    );
                                
                                    const validResults = factoryResults.filter(
                                      (result): result is { factoryName: string; bestAmountOut: bigint; routerAddress: string, factoryAddress: string, bestTupleRoute: `0x${string}`, factory: string } =>
                                        result !== null
                                    );
                                
                                    if (!validResults.length) {
                                      throw new Error("No valid routes found across all factories.");
                                    }
                                
                                    const { factoryName, bestAmountOut, routerAddress, factoryAddress, bestTupleRoute } = validResults.reduce(
                                      (best, current) => (current.bestAmountOut > best.bestAmountOut ? current : best),
                                      { factoryName: "", bestAmountOut: BigInt(0), routerAddress: "", factoryAddress: "", bestTupleRoute: "0x", factory:""  }
                                    );
                                
                                    
                                    
                                    // Convert the best amount out to the appropriate format and return
                                    
                                    return {bestAmountOut: bestAmountOut, Dex: factoryName, routerAddress, route: bestTupleRoute, factory:factoryAddress
                                    };
                                  } catch (error) {
                                    console.error("Error calculating amount out:", error);
                                    return {bestAmountOut: 0n, Dex: "", routerAddress:"", route:"", factory:""}; // Fallback value
                                  }
                                };
                                
                                const calculateAmountInV3 = async (inputValue: bigint,
                                    tokenA: Token,
                                tokenB:Token,
                                chainId: number,
                                chainData: any
                                ): Promise<{bestAmountOut:bigint, Dex:string, routerAddress: string, route: any , factory: string}> => {
                                    let UniswapV3: any[];
          
                            UniswapV3 = chainData.UniswapV3 || [];
                                  try {
                                    
                                const factoryResults = await Promise.all(
                                      UniswapV3.map(async (factory) => {
                                        try {
                                                                          
          
                                          const commonPairs = await findPairsForLiquidityTokensV3Input( factory.factory, tokenA, tokenB, chainId, chainData);
                                          
                                      
                                            const { bestAmountOut, bestTupleRoute } = await calculateBestAmountInV3(commonPairs, inputValue, factory.quoterV2 || "", chainId);
                                      
                                          return { factoryName: factory.name, bestAmountOut, routerAddress: factory.router, factoryAddress: factory.factory, bestTupleRoute };
                                        } catch (error) {
                                          return null;
                                        }
                                      })
                                    );
                                
                                    const validResults = factoryResults.filter(
                                      (result): result is { factoryName: string; bestAmountOut: bigint; routerAddress: string, factoryAddress: string, bestTupleRoute: `0x${string}` } =>
                                        result !== null
                                    );
                                
                                    if (!validResults.length) {
                                      throw new Error("No valid routes found across all factories.");
                                    }
                                
                                    const { factoryName, bestAmountOut, routerAddress, factoryAddress, bestTupleRoute } = validResults.reduce(
                                      (best, current) => (current.bestAmountOut < best.bestAmountOut ? current : best),
                                      { factoryName: "", bestAmountOut: BigInt(999999999999999999999999999999999999999999), routerAddress: "", factoryAddress: "", bestTupleRoute: "0x"  }
                                    );
                                    
                                    console.log("router", routerAddress)
                                    
                                    const amountOutRoute = bestAmountOut == 999999999999999999999999999999999999999999n ? 0n: bestAmountOut; 
                                    
                                    return {bestAmountOut: amountOutRoute, Dex: factoryName, routerAddress: routerAddress, route: bestTupleRoute, factory:factoryAddress};
                                  } catch (error) {
                                    return {bestAmountOut: 0n, Dex: "", routerAddress:"", route:"", factory:""}; // Fallback value
                                  }
                                };
                                
                                
                                
                                
                                
      
                                const calculateAmountOutV3SingleV1 = async (inputValue: bigint,
                                    tokenA: Token,
                                tokenB:Token,
                                chainId: number,
                                chainData: any
                                ): Promise<{bestAmountOut:bigint, Dex:string, routerAddress: string, route: any, fee: number, factory: string}> => {
                                let UniswapV3: any[]; 
                                UniswapV3 = chainData.UniswapV3 || []
                                const NETWORK = defineChain(chainId);
    
                                  try {
                                    
                                              const factoryResults = await Promise.all(
                                      UniswapV3.map(async (factory) => {
                                        try {
                                      
                                        const transaction = prepareContractCall({
                                              contract: getContract({ client, chain: NETWORK, address: factory.quoterV1 || "" }),
                                              method: 
                                              "function quoteExactInputSingle(address tokenIn, address tokenOut, uint256 amountIn, uint160 limitSqrtPrice) returns (uint256 amountOut, uint16 fee)",                                        
                                              params: [tokenA.contractAddress, tokenB.contractAddress,inputValue, 0n],
                                            });
      
                                      
                          
                                     const simulation = await simulateTransaction({
                                             transaction,
                                            });
                                           // Log and update the state with simulation results
                                            
                                            const bestAmountOut = simulation[0] || 0n;
                                          const fee = simulation[1]
                                          return { factoryName: factory.name, bestAmountOut, routerAddress: factory.routerV1, fee: fee, factory: factory.factory };
                                        } catch (error) {
                                          return null;
                                        }
                                      })                                );
                                
                                    // Filter valid results
                                    const validResults = factoryResults.filter(
                                      (result): result is { factoryName: string; bestAmountOut: bigint; routerAddress: string; fee: number, factory:string } =>
                                        result !== null
                                    );
                                
                                    if (!validResults.length) {
                                      throw new Error("No valid routes found across all factories.");
                                    }
                                
                                    // Find the best route
                                    const { factoryName, bestAmountOut, routerAddress, fee, factory } = validResults.reduce(
                                      (best, current) => (current.bestAmountOut > best.bestAmountOut ? current : best),
                                      { factoryName: "", bestAmountOut: BigInt(0), routerAddress: "" , fee:0, factory:""}
                                    );
                                
                                
                                    return {bestAmountOut: bestAmountOut, Dex: factoryName, routerAddress:routerAddress, route:[tokenA.contractAddress, tokenB.contractAddress],fee: fee, factory:factory};
                                  } catch (error) {
                                    console.error("Error calculating amount out:", error);
                                    return {bestAmountOut: 0n, Dex: "", routerAddress:"", route:"",fee: 0, factory:""}; // Fallback value
                                  }
                                };
      
                                const calculateAmountOutV3Single = async (inputValue: bigint,
                                    tokenA: Token,
                                tokenB:Token,
                                chainId: number,
                                chainData: any
                                ): Promise<{bestAmountOut:bigint, Dex:string, routerAddress: string, route: any, fee: number, factory: string}> => {
                                            let UniswapV3: any[];
                                            const NETWORK = defineChain(chainId);
    
                                    UniswapV3 = chainData.UniswapV3 || []
                                 
                                  try {
                                    
                                   
                                const factoryResults = await Promise.all(
                                      UniswapV3.map(async (factory) => {
                                        try {
                                          
                                          const feesForLtoOtherL = await getAvailableFeeTiers(
                                            tokenA.contractAddress,
                                            tokenB.contractAddress,
                                            factory.factory || "",
                                            chainId
                                          );
                                          
                                          
                                        const path = {
                                          tokenIn: tokenA.contractAddress,
                                          tokenOut: tokenB.contractAddress,
                                          amountIn: inputValue,
                                          fee: feesForLtoOtherL[0], // number
                                          sqrtPriceLimitX96: BigInt(0), // bigint
                                      };
    
                                        const transaction = prepareContractCall({
                                              contract: getContract({ client, chain: NETWORK, address: factory.quoterV2 || "" }),
                                              method: 
                                              "function quoteExactInputSingle((address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96) params) returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)",
                                              params: [path],
                                            });
    
                                      
                          
                                     const simulation = await simulateTransaction({
                                             transaction,
                                            });
                                            console.log("transaction" , simulation)
    
                                           // Log and update the state with simulation results
                                            if (!simulation) {
                                              throw new Error("No valid input amount received.");
                                            }
                                          const bestAmountOut = simulation[0];
                                          return { factoryName: factory.name, bestAmountOut, routerAddress: factory.router, fee:feesForLtoOtherL[0], factory: factory.factory  };
                                        } catch (error) {
                                          return null;
                                        }
                                      })
                                    );
                                
                                    // Filter valid results
                                    const validResults = factoryResults.filter(
                                      (result): result is { factoryName: string; bestAmountOut: bigint; routerAddress: string; fee: number, factory: string } =>
                                        result !== null
                                    );
                                
                                    if (!validResults.length) {
                                      throw new Error("No valid routes found across all factories.");
                                    }
                                
                                    // Find the best route
                                    const { factoryName, bestAmountOut, routerAddress , fee, factory} = validResults.reduce(
                                      (best, current) => (current.bestAmountOut > best.bestAmountOut ? current : best),
                                      { factoryName: "", bestAmountOut: BigInt(0), routerAddress: "" , fee: 0, factory:""}
                                    );
                                
                                    
                                    
                                
                                    // Convert the best amount out to the appropriate format and return
                                    return {bestAmountOut: bestAmountOut, Dex: factoryName, routerAddress: routerAddress, route:[tokenA.contractAddress, tokenB.contractAddress],fee: fee, factory:factory};
                                  } catch (error) {
                                    console.error("Error calculating amount out:", error);
                                    return {bestAmountOut: 0n, Dex: "", routerAddress:"", route:"",fee: 0, factory:""}; // Fallback value
                                  }
                                };
                    
                                
      
      
                                const calculateAmountInV3Single = async (inputValue: bigint,
                                tokenA: Token,
                                tokenB:Token,
                                chainId: number,
                                chainData: any
                                ): Promise<{bestAmountOut:bigint, Dex:string, routerAddress: string, route: any, fee: number, factory: string}> => {
                                    let UniswapV3: any[];
                            UniswapV3 = chainData.UniswapV3 || []
                            const NETWORK = defineChain(chainId);
    
                                  try {
                                    // Explicitly handle the native token/WETH 1:1 swap case
                                                               
                                
                                  
                                const factoryResults = await Promise.all(
                                      UniswapV3.map(async (factory) => {
                                        try {
                                        
                                          const feesForLtoOtherL = await getAvailableFeeTiers(
                                            tokenA.contractAddress,
                                            tokenB.contractAddress,
                                            factory.factory || "",
                                            chainId
                                          );
                                        const params = {
                                          tokenIn: tokenA.contractAddress,
                                          tokenOut: tokenB.contractAddress, 
                                          amount: inputValue, 
                                          fee: feesForLtoOtherL[0],
                                          sqrtPriceLimitX96: 0n,
                                        };
    
      
                                       const transaction = prepareContractCall({
                                              contract: getContract({ client, chain: NETWORK, address: factory.quoterV2 || "" }),
                                              method: 
                                              "function quoteExactOutputSingle((address tokenIn, address tokenOut, uint256 amount, uint24 fee, uint160 sqrtPriceLimitX96) params) returns (uint256 amountIn, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)",
                                              params: [params],
                                            });
                                            // Simulate the transaction
                                            const simulation = await simulateTransaction({
                                              transaction,
                                             });
      
    
                                          const bestAmountOut = simulation[0];
                                          return { factoryName: factory.name, bestAmountOut, routerAddress: factory.router, fee:feesForLtoOtherL[0], factory:factory.factory };
                                        } catch (error) {
                                          return null;
                                        }
                                      })
                                    );
                                    const validResults2 = factoryResults.filter((result) => result !== undefined);
    
                                    // Filter valid results
                                    const validResults = validResults2.filter(
                                      (result): result is { factoryName: string; bestAmountOut: bigint; routerAddress: string; fee: number, factory: string } =>
                                        result !== null
                                    );
                                
                                    if (!validResults.length) {
                                      throw new Error("No valid routes found across all factories.");
                                    }
                                
                                    // Find the best route
                                    const { factoryName, bestAmountOut, routerAddress,fee, factory  } = validResults.reduce(
                                      (best, current) => (current.bestAmountOut < best.bestAmountOut ? current : best),
                                      { factoryName: "", bestAmountOut: BigInt(999999999999999999999999999999999999999999), routerAddress: "" , fee: 0, factory:""}
                                    );
                                
                                    
                                
                                    
                                    return  {bestAmountOut: bestAmountOut, Dex: factoryName, routerAddress:routerAddress, route:[tokenA.contractAddress, tokenB.contractAddress],fee: fee, factory: factory
                                    };
                                  } catch (error) {
                                    console.error("Error calculating amount out:", error);
                                    return  {bestAmountOut: 0n, Dex: "", routerAddress:"", route:"",fee: 0, factory:""}; // Fallback value
                                  }
                                };
                   
                               
      
      
                                const calculateAmountInV3SingleV1 = async (inputValue: bigint,
                                    tokenA: Token,
                                tokenB:Token,
                                chainId: number,
                                chainData: any
                                ): Promise<{ bestAmountOut: bigint;
                                    Dex: string;
                                    routerAddress: string;
                                    route: any;
                                    fee:number;
                                     factory: string}> => {
                                    let UniswapV3: any[];
                                     UniswapV3 = chainData.UniswapV3 || []
                                  
                                  try {
                                    const NETWORK = defineChain(chainId);
                                    
                                const factoryResults = await Promise.all(
                                      UniswapV3.map(async (factory) => {
                                        try {
                                         
                                       const transaction = prepareContractCall({
                                              contract: getContract({ client, chain: NETWORK, address: factory.quoterV1 || "" }),
                                              method: 
                                              "function quoteExactOutputSingle(address tokenIn, address tokenOut, uint256 amountOut, uint160 limitSqrtPrice) returns (uint256 amountIn, uint16 fee)",
                                              params: [tokenA.contractAddress, tokenB.contractAddress, inputValue, 0n],
                                            });
                                            // Simulate the transaction
                                            const simulation = await simulateTransaction({
                                              transaction,
                                             });
                                             const bestAmountOut = simulation[0] ;
                                          return { factoryName: factory.name, bestAmountOut: bestAmountOut, routerAddress: factory.routerV1, fee: simulation[1], factory:factory.factory };
                                        } catch (error) {
                                          console.warn(`Error processing factory ${factory.name}:`, error);
                                          
                                        }
                                      })
                                    );
                                    const validResults2 = factoryResults.filter((result) => result !== undefined);
    
                                    // Filter valid results
                                    const validResults = validResults2.filter(
                                      (result): result is { factoryName: string; bestAmountOut: bigint; routerAddress: string; fee: number, factory: string } =>
                                        result !== null
                                    );
                                
                                    if (!validResults.length) {
                                      throw new Error("No valid routes found across all factories.");
                                    }
                                
                                    // Find the best route
                                    const { factoryName, bestAmountOut, routerAddress, fee, factory } = validResults.reduce(
                                      (best, current) => (current.bestAmountOut < best.bestAmountOut ? current : best),
                                      { factoryName: "", bestAmountOut: BigInt(999999999999999999999999999999999999999999), routerAddress: "",fee:0, factory:""}
                                    );
                                
      
                                    // Convert the best amount out to the appropriate format and return
                                    return  {bestAmountOut: bestAmountOut, Dex: factoryName, routerAddress:routerAddress, route:{tokenIn: tokenA.contractAddress, tokenOut: tokenB.contractAddress},fee: fee, factory:factory};
                                  } catch (error) {
                                    return  {bestAmountOut: 0n, Dex: "", routerAddress:"", route:"",fee: 0, factory:""}; // Fallback value
                                  }
                                };
    
                                
                   
                           
                        
                            const calculateBestAmountOutV2 = async (
                              routes: string[][],
                              amountIn2: bigint,
                              routerContract: any
                            ): Promise<{ bestAmountOut: bigint; bestTupleRoute: string[]}> => {
                              let bestAmountOut: bigint = BigInt(0);
                              let bestTupleRoute: string[] = ["0x"]; // Start with the largest possible value
                            
                              const results = await Promise.all(
                                routes.map(async (route) => {
                                  try {
                                    const amountsOutTwoHop = await readContract({
                                      contract: routerContract,
                                      method: 
                                      "function getAmountsOut(uint256 amountIn, address[] path) view returns (uint256[] amounts)",
                                      params: [amountIn2, route],
                                    });
                                    return { route, amountIn: BigInt(amountsOutTwoHop[amountsOutTwoHop.length - 1]) }; // Return the route and amount
                                  } catch (error) {
                                    return null; // Skip failed routes
                                  }
                                })
                              );
                            
                              // Filter out failed routes and find the best result
                              results.forEach((result) => {
                                if (result && result.amountIn > bestAmountOut) {
                                  bestAmountOut = result.amountIn;
                                  bestTupleRoute = result.route;
                                }
                              });
                            
                              return { bestAmountOut: bestAmountOut,  bestTupleRoute };
                            };
      
                            const calculateBestAmountOutV3V1 = async (
                              routes: `0x${string}`[],
                              amountIn2: bigint,
                              quouter: string,
                              chainId: number,
                            ): Promise<{ bestAmountOut: bigint; bestTupleRoute: `0x${string}`}> => {
                              let bestAmountOut: bigint = BigInt(0);
                              let bestTupleRoute: `0x${string}` = "0x";
                             const NETWORK = defineChain(chainId)
                              const results = await Promise.all(
                                routes.map(async (route) => {
                                  try {
                                     const transaction = prepareContractCall({
                                              contract: getContract({ client, chain: NETWORK, address: quouter }),
                                              method: 
                                              "function quoteExactInput(bytes path, uint256 amountIn) returns (uint256 amountOut, uint16[] fees)",
                                              params: [route,amountIn2],
                                            });
                                        // Simulate the transaction
                                        const simulation = await simulateTransaction({
                                          transaction,
                                         });
                                    return { route, amountIn: simulation[0] }; // Return the route and amount
                                  } catch (error) {
                                    return null; // Skip failed routes
                                  }
                                })
                              );
                            
                              // Filter out failed routes and find the best result
                              results.forEach((result) => {
                                if (result && result.amountIn > bestAmountOut) {
                                  bestAmountOut = result.amountIn;
                                  bestTupleRoute = result.route;
                                }
                              });
                            
                              return { bestAmountOut: bestAmountOut, bestTupleRoute };
                            };
      
                            const calculateAmountOutV3V1 = async (inputValue: any, tokenA: Token,
                                tokenB:Token,
                                chainId: number,
                                chainData: any): Promise<{bestAmountOut:bigint, Dex:string, routerAddress: string, route: any, factory:string}> => {
                                    let UniswapV3: any[];
                        
                                    UniswapV3 = chainData.UniswapV3 || [];
                              
      
                              try {
                            const factoryResults = await Promise.all(
                                  UniswapV3.map(async (factory) => {
                                    try {
                                      const commonPairs = await findPairsForLiquidityTokensV3V1( factory.factory, tokenA, tokenB, chainId, chainData);
    
                                      const { bestAmountOut, bestTupleRoute } = await calculateBestAmountOutV3V1(commonPairs, inputValue, factory.quoterV1 || "", chainId);
      
                                      return { factoryName: factory.name, bestAmountOut, routerAddress: factory.routerV1, factoryAddress: factory.factory, bestTupleRoute };
                                    } catch (error) {
                                      return null;
                                    }
                                  })
                                );
      
                                const validResults = factoryResults.filter(
                                  (result): result is { factoryName: string; bestAmountOut: bigint; routerAddress: string, factoryAddress: string, bestTupleRoute: `0x${string}` } =>
                                    result !== null
                                );
                            
                                if (!validResults.length) {
                                  throw new Error("No valid routes found across all factories.");
                                }
                            
                                const { factoryName, bestAmountOut, routerAddress, factoryAddress, bestTupleRoute } = validResults.reduce(
                                  (best, current) => (current.bestAmountOut > best.bestAmountOut ? current : best),
                                  { factoryName: "", bestAmountOut: BigInt(0), routerAddress: "", factoryAddress: "", bestTupleRoute: "0x"  }
                                );
                            
                            
                                
                                // Convert the best amount out to the appropriate format and return
                                return {bestAmountOut: bestAmountOut, Dex: factoryName,routerAddress: routerAddress,route: bestTupleRoute, factory:factoryAddress};
                              } catch (error) {
                                console.error("Error calculating amount out:", error);
                                return {bestAmountOut: 0n, Dex: "",routerAddress: "",route: "", factory:""}; // Fallback value
                              }
                            };
      
                            const calculateBestAmountInV3V1 = async (
                              routes: `0x${string}`[],
                              amountOut: bigint,
                              quouter: string,
                              chainId: number,
                            ): Promise<{ bestAmountOut: bigint; bestTupleRoute: `0x${string}`}> => {
                              let bestAmountOut: bigint = BigInt(999999999999999999999999999999999999999999);
                              const NETWORK = defineChain(chainId)
                              let bestTupleRoute: `0x${string}` = "0x";
                        
                              const results = await Promise.all(
                                routes.map(async (route) => {
                                  try {
                                     const transaction = prepareContractCall({
                                              contract: getContract({ client, chain: NETWORK, address: quouter }),
                                              method: 
                                              "function quoteExactOutput(bytes path, uint256 amountOut) returns (uint256 amountIn, uint16[] fees)",
                                              params: [route,amountOut],
                                            }); 
                                        // Simulate the transaction
                                        const simulation = await simulateTransaction({
                                          transaction,
                                         });
                                    return { route, amountIn: simulation[0] }; // Return the route and amount
                                  } catch (error) {
                                    return null; // Skip failed routes
                                  }
                                })
                              );
                            
                              // Filter out failed routes and find the best result
                              results.forEach((result) => {
                                if (result && result.amountIn < bestAmountOut) {
                                  bestAmountOut = result.amountIn;
                                  bestTupleRoute = result.route;
                                }
                              });
                            
                              return { bestAmountOut: bestAmountOut, bestTupleRoute };
                            };
      
                            const calculateAmountInV1 = async (
                                inputValue: bigint,
                                tokenA: Token,
                                tokenB:Token,
                                chainId: number,
                                chainData: any): Promise<{bestAmountOut:bigint, Dex:string, routerAddress: string, path: any, factory: string}> => {
                              let UniswapV3: any[];
                                UniswapV3 = chainData.UniswapV3 || [];
                              try {                                                 
                            const factoryResults = await Promise.all(
                                  UniswapV3.map(async (factory) => {
                                    try {
                                                                      
      
                                      const commonPairs = await findPairsForLiquidityTokensV3V1Single ( factory.factory, tokenA, tokenB, chainId, chainData);
                                      
                                  
                                        const { bestAmountOut, bestTupleRoute } = await calculateBestAmountInV3V1(commonPairs, inputValue, factory.quoterV1 || "", chainId);
                                      return { factoryName: factory.name, bestAmountOut, routerAddress: factory.routerV1, factoryAddress: factory.factory, bestTupleRoute };
                                    } catch (error) {
                                      return null;
                                    }
                                  })
                                );
      
                                const validResults = factoryResults.filter(
                                  (result): result is { factoryName: string; bestAmountOut: bigint; routerAddress: string, factoryAddress: string, bestTupleRoute: `0x${string}` } =>
                                    result !== null
                                );
                            
                                if (!validResults.length) {
                                  throw new Error("No valid routes found across all factories.");
                                }
                            
                                const { factoryName, bestAmountOut, routerAddress, factoryAddress, bestTupleRoute } = validResults.reduce(
                                  (best, current) => (current.bestAmountOut < best.bestAmountOut ? current : best),
                                  { factoryName: "", bestAmountOut: BigInt(999999999999999999999999999999999999999999), routerAddress: "", factoryAddress: "", bestTupleRoute: "0x"  }
                                );
                            
                            
                                
                                const bestAmount = bestAmountOut == 999999999999999999999999999999999999999999n ? 0n: bestAmountOut;
                                return {bestAmountOut: bestAmount, Dex: factoryName,routerAddress: routerAddress, path: bestTupleRoute, factory:factoryAddress};
                              } catch (error) {
                                console.error("Error calculating amount out:", error);
                                return {bestAmountOut: 0n, Dex: "",routerAddress: "", path: "", factory:""}; // Fallback value
                              }
                            };
                
                const findPairsForLiquidityTokensV3V1 = async (
                  factory: any,
                  tokenA: Token,
                tokenB:Token,
                chainId: number,
                chainData: any
                ): Promise<`0x${string}`[]> => {
                  let paths: `0x${string}`[] = [];
                  if (!tokenA || !tokenB ) {
                    return ["0x"]; // Return fallback value
                  }
                  console.log(chainId, factory)

                  const liquidityTokens = chainData.liquidityTokens;
                const WETH9 = chainData.wrappedAddress;
                  for (const liquidityToken of liquidityTokens) {
                    if (!liquidityToken.address) {
                      console.warn(`Skipping liquidity token with missing address:`, liquidityToken);
                      continue;
                    }
                    
                    const tokenAddressA = tokenA?.contractAddress === NATIVE_TOKEN_ADDRESS 
                          ? WETH9 
                          : tokenA.contractAddress;
                  
                          const tokenAddressB = tokenB?.contractAddress === NATIVE_TOKEN_ADDRESS 
                    ? WETH9 
                    : tokenB.contractAddress;
        
                        
                    if (liquidityToken.address !== tokenAddressB || tokenAddressA) {
      
                        const path2: `0x${string}` = ethers.utils.solidityPack(
                          ["address", "address", "address"],
                          [tokenAddressA, liquidityToken.address, tokenAddressB]
                        ) as `0x${string}`;
                        
                        paths.push(path2);
                    }
                    
                        // Optionally handle more complex paths (e.g., 3-hop swaps) if needed
                        for (const otherLiquidityToken of liquidityTokens) {
                          if (
                            otherLiquidityToken.address &&
                            otherLiquidityToken.address !== liquidityToken.address
                          ) {
                            if (liquidityToken.address !== tokenAddressB || tokenAddressA) {
                              if (otherLiquidityToken.address !== tokenAddressB || tokenAddressA) {
      
                            const path3: `0x${string}` = ethers.utils.solidityPack(
                              [
                                "address",
                                "address",
                                "address",
                                "address",
                              ],
                              [
                                tokenAddressA,
                                liquidityToken.address,
                                otherLiquidityToken.address,
                                tokenAddressB,
                              ]
                            ) as `0x${string}`;
                            
                            paths.push(path3);
                          }
                            }
                          }
                          }
                  }
                
                  return paths;
                };
      
                const findPairsForLiquidityTokensV3V1Single = async (
                  factory: any,
                  tokenA: Token,
                tokenB:Token,
                chainId: number,
                chainData: any
                ): Promise<`0x${string}`[]> => {
                  console.log(factory, chainId)
                  let paths: `0x${string}`[] = [];
                  if (!tokenA || !tokenB ) {
                    return ["0x"]; // Return fallback value
                  }
                const liquidityTokens = chainData.liquidityTokens;
                const WETH9 = chainData.wrappedAddress;
                  for (const liquidityToken of liquidityTokens) {
                    if (!liquidityToken.address) {
                      console.warn(`Skipping liquidity token with missing address:`, liquidityToken);
                      continue;
                    }
                    
                    const tokenAddressA = tokenA?.contractAddress === NATIVE_TOKEN_ADDRESS 
                          ? WETH9 
                          : tokenA.contractAddress;
                  
                          const tokenAddressB = tokenB?.contractAddress === NATIVE_TOKEN_ADDRESS 
                    ? WETH9 
                    : tokenB.contractAddress;
        
                        
                if (liquidityToken.address !== tokenAddressB || tokenAddressA) {
                       
                        const path2: `0x${string}` = ethers.utils.solidityPack(
                          ["address", "address", "address"],
                          [tokenAddressB, liquidityToken.address, tokenAddressA]
                        ) as `0x${string}`;
                        
                        paths.push(path2);
                      
                      }
                        // Optionally handle more complex paths (e.g., 3-hop swaps) if needed
                        for (const otherLiquidityToken of liquidityTokens) {
                          if (
                            otherLiquidityToken.address &&
                            otherLiquidityToken.address !== liquidityToken.address
                          ) {
                            
                            if (liquidityToken.address !== tokenAddressB || tokenAddressA) {
                              if (otherLiquidityToken.address !== tokenAddressB || tokenAddressA) {
      
                            const path3: `0x${string}` = ethers.utils.solidityPack(
                              [
                                "address",
                                "address",
                                "address",
                                "address",
                              ],
                              [
                                tokenAddressB,
                                liquidityToken.address,
                                otherLiquidityToken.address,
                                tokenAddressA,
                              ]
                            ) as `0x${string}`;
                            
                            paths.push(path3);
                          }
                            }
                          }
                        }
                  }
                
                  return paths;
                };
                
      
              const findPairsForLiquidityTokensV2 = async (
                factory: any,
                tokenA: Token,
                tokenB:Token,
                chainId: number,
                chainData: any
              ): Promise<string[][]> => {
                const pairs: string[][] = []; // An array of arrays of strings
                if (!tokenA || !tokenB ) {
                  return [[""]]; // Return fallback value
                }
                console.log(chainId,factory)

                const liquidityTokens = chainData.liquidityTokens;
                const WETH9 = chainData.wrappedAddress;
                for (const liquidityToken of liquidityTokens) {
                  if (!liquidityToken.address) {
                    console.warn(`Skipping liquidity token with missing address:`, liquidityToken);
                    continue;
                  }
                  
                  const tokenAddressA = tokenA?.contractAddress === NATIVE_TOKEN_ADDRESS 
                      ? WETH9 
                      : tokenA.contractAddress;
              
                      const tokenAddressB = tokenB?.contractAddress === NATIVE_TOKEN_ADDRESS 
                ? WETH9 
                : tokenB.contractAddress;
      
                      const path5 =  [tokenAddressA, tokenAddressB];
                      
              
                      pairs.push(path5);
              
                  
              
                      if (liquidityToken.address !== tokenAddressB || tokenAddressA) {
      
                      const path2 =  [tokenAddressA, liquidityToken.address, tokenAddressB];
                      
              
                      pairs.push(path2);
                      }
                      // Optionally handle more complex paths (e.g., 3-hop swaps) if needed
                      for (const otherLiquidityToken of liquidityTokens) {
                        if (
                          otherLiquidityToken.address &&
                          otherLiquidityToken.address !== liquidityToken.address
                        ) {
                          if (liquidityToken.address != tokenAddressB || tokenAddressA) {
                            if (otherLiquidityToken.address !== tokenAddressB || tokenAddressA) {
      
                              const path3 =  [tokenAddressA,
                                liquidityToken.address,
                                otherLiquidityToken.address,
                                tokenAddressB];
      
                              pairs.push(path3);
                            }
                          }
                        }
                      }
                }
              
                return pairs;
              };
                
                  
                  
                  const calculateAmountOutV2 = async (inputValue: bigint,
                    tokenA: Token,
                    tokenB:Token,
                    chainId: number,
                    chainData: any): Promise<{bestAmountOut:bigint, Dex:string, routerAddress: string, route: any, factory:string}> => {
                      
                                  let UniswapV2: any[];
                             try {
                                UniswapV2 = chainData.UniswapV2 || [];
                                const NETWORK = defineChain(chainId)
                            
                               
                            
                            const factoryResults = await Promise.all(
                                  UniswapV2.map(async (factory) => {
                                    try {
                                      
                                    const routerContract = getContract({ address: factory.router || "", client, chain: NETWORK });
                                      const route = await findPairsForLiquidityTokensV2(factory.factory, tokenA, tokenB, chainId, chainData)
    
                                      if (!route) {
                                        throw new Error("No valid route received.");
                                      }                                
                                      const amountsOut = await calculateBestAmountOutV2(route,inputValue,routerContract);
    
                                      if (!amountsOut) {
                                        throw new Error("No valid output amount received.");
                                      }
                                     
                                      const bestAmountOut =  amountsOut.bestAmountOut;
                                      return { factoryName: factory.name, bestAmountOut, path: amountsOut.bestTupleRoute, routerAddress: factory.router,  factory:factory.factory };
                                    } catch (error) {
                                      return null;
                                    }
                                  })
                                );
                            
                                // Filter valid results
                                const validResults = factoryResults.filter(
                                  (result): result is { factoryName: string; bestAmountOut: bigint; path: string[]; routerAddress: string, factory:string } =>
                                    result !== null
                                );
                            
                                if (!validResults.length) {
                                  throw new Error("No valid routes found across all factories.");
                                }
                            
                                // Find the best route
                                const { factoryName, bestAmountOut, path: bestRoute, routerAddress, factory } = validResults.reduce(
                                  (best, current) => (current.bestAmountOut > best.bestAmountOut ? current : best),
                                  { factoryName: "", bestAmountOut: BigInt(0), path: [], routerAddress: "", factory:"" }
                                );
                            
                                
                                
      
                                return {bestAmountOut: bestAmountOut, Dex: factoryName,routerAddress: routerAddress,route: bestRoute, factory: factory};
                              } catch (error) {
                                return {bestAmountOut: 0n, Dex: "",routerAddress: "",route: "", factory:""}; // Fallback value
                              }
                            };

                            const calculateAmountInV2 = async (
                                inputValue: bigint,
                                tokenA: Token,
                                tokenB:Token,
                                chainId: number,
                                chainData:any
                                ): Promise<{bestAmountOut:bigint, Dex:string, routerAddress: string, route: any, factory: string}> => {
                             if (!chainData) return {bestAmountOut: 0n, Dex: "", routerAddress: "",route: "", factory:""}; // Return fallback value
                                let UniswapV2: any[];
                              
                              const NETWORK = defineChain(chainId)
                              try {
                                    UniswapV2 = chainData.UniswapV2 || [];
    
                                // Explicitly handle the native token/WETH 1:1 swap case
                                
      
                            const factoryResults = await Promise.all(
                                  UniswapV2.map(async (factory) => {
                                    try {
                                      
                                    const routerContract = getContract({ address: factory.router || "", client, chain: NETWORK });
                                      const route = await findPairsForLiquidityTokensV2(factory.factory, tokenA, tokenB,chainId, chainData)
                                      if (!route) {
                                        throw new Error("No valid route received.");
                                      }                                
                                      const amountsOut = await calculateBestAmountInV2(route,inputValue,routerContract);
                            
                                      if (!amountsOut) {
                                        throw new Error("No valid output amount received.");
                                      }
                            
                                      const bestAmountOut =  amountsOut.bestAmountOut;
                                      return { factoryName: factory.name, bestAmountOut, path: amountsOut.bestTupleRoute, routerAddress: factory.router, factory: factory.factory };
                                    } catch (error) {
                                      return null;
                                    }
                                  })
                                );
                            
                                // Filter valid results
                                const validResults = factoryResults.filter(
                                  (result): result is { factoryName: string; bestAmountOut: bigint; path: string[]; routerAddress: string, factory: string } =>
                                    result !== null
                                );
                            
                                if (!validResults.length) {
                                  throw new Error("No valid routes found across all factories.");
                                }
                            
                                // Find the best route
                                const { factoryName, bestAmountOut, path: bestRoute, routerAddress, factory } = validResults.reduce(
                                  (best, current) => (current.bestAmountOut < best.bestAmountOut ? current : best),
                                  { factoryName: "", bestAmountOut: BigInt(999999999999999999999999999999999999999999), path: [], routerAddress: "", factory:"" }
                                );
                            
                                
                                const bestAmount = bestAmountOut == 999999999999999999999999999999999999999999n ? 0n: bestAmountOut;
      
                                // Convert the best amount out to the appropriate format and return
                                return {bestAmountOut: bestAmount, Dex: factoryName,routerAddress: routerAddress,route: bestRoute, factory:factory};
                              } catch (error) {
                                console.error("Error calculating amount out:", error);
                                return {bestAmountOut: 0n, Dex: "",routerAddress: "",route: "", factory:""}; // Fallback value
                              }
                            };
      
                            const calculateBestAmountInV2 = async (
                              routes: string[][],
                              amountIn2: bigint,
                              routerContract: any
                            ): Promise<{ bestAmountOut: bigint; bestTupleRoute: string[]}> => {
                              let bestAmountOut: bigint = BigInt(999999999999999999999999999999999999999999);
                              let bestTupleRoute: string[] = ["0x"]; 
                            
                              const results = await Promise.all(
                                routes.map(async (route) => {
                                  try {
                                    const amountsIn = await readContract({
                                      contract: routerContract,
                                      method: 
                                      "function getAmountsIn(uint256 amountOut, address[] path) view returns (uint256[] amounts)",
                                      params: [amountIn2, route],
                                    });
                           
                                    const lastAmountOutSingleHop = amountsIn[0];
                               
                                    return { route, amountIn: lastAmountOutSingleHop }; // Return the route and amount
                                  } catch (error) {
                                    return null; // Skip failed routes
                                  }
                                })
                              );
                            
                              // Filter out failed routes and find the best result
                              results.forEach((result) => {
                                if (result && result.amountIn < bestAmountOut) {
                                  bestAmountOut = result.amountIn;
                                  bestTupleRoute = result.route;
                                }
                              });
                            
                              return { bestAmountOut: bestAmountOut, bestTupleRoute };
                            };
    
    
                            
                            export async function getAmountsIn(
                                tokenIn: Token,
                                tokenOut: Token,
                                chainId: number,
                                inputValue: bigint,
                            ): Promise<{
                                dex:string;
                                bestAmountOut: bigint;
                                bestDex: BuyingStepDex;
                                fee: number;
                                route: any;
                                routerAddress: string;
                                factory:string;
                              } | null> {
    
                                let bestAmountOut: bigint = 999999999999999999999999999999999999999999n; // Start with the largest possible value
                                let bestDex: BuyingStepDex = "Uniswapv2"; // Default value for bestDex
                                let dex: string = ""; // Default value for bestDex
                                let factory: string = ""; // Default value for bestDex
                                let fee: number = 0;
                                let route: any = "";
                                let routerAddress: string = "";
                                if (!tokenIn || !tokenOut ) {
                                return null; // Return fallback value
                              }
                              

                              const chainData = Object.values(UNISWAP_CONTRACTS2).find(
                                (data) => data.chainId === chainId
                              );
                            
                              if (!chainData) {
                                console.error(`Chain data not found for chainId: ${chainId}`);
                                return null;
                              }
                                const WETH9 = chainData.wrappedAddress;
                                try {
    
                                    if (
                                        (tokenIn.contractAddress.toLowerCase() === WETH9.toLowerCase() && tokenOut.contractAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()) ||
                                        (tokenIn.contractAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase() && tokenOut.contractAddress.toLowerCase() === WETH9.toLowerCase())
                                      ) {
                                  const input = tokenIn.contractAddress === WETH9 ? "Withdraw":"Deposit";
                                        return {dex: "WETH9", bestAmountOut: BigInt(Math.floor(Number(inputValue) * 10 ** 18)), bestDex: "WrappedContract", fee: 0, routerAddress: chainData.wrappedContract,route: input, factory:""   }; // 1:1 rate
                                      }
                                  
                                      // Initialize addresses for tokenA and tokenB
                                      const tokenAAddress:Token =
                                        tokenIn.contractAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase() ? {contractAddress: WETH9 , decimals:18} : tokenIn;
                                      const tokenBAddress:Token =
                                        tokenOut.contractAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase() ? {contractAddress: WETH9 , decimals:18} : tokenOut;
                                  
                                      if (tokenAAddress === tokenBAddress) {
                                        throw new Error("Token addresses are identical. Cannot calculate a path.");
                                      }
                                  
                                      
                                     
                                      if (isAddress(chainData.veldromeRouter)) {
                                 
                                    const amountOutVeldrome = await calculateAmountInVeldrome(inputValue, tokenAAddress, tokenBAddress, chainId, chainData);
                              
                                    if (amountOutVeldrome.bestAmountOut < bestAmountOut && amountOutVeldrome.bestAmountOut !== 0n) {
                                      console.log("Updating best route (Veldrome)");
                                      bestAmountOut = amountOutVeldrome.bestAmountOut;
                                      bestDex = "Veldrome";
                                      dex = "Veldrome";
                                      routerAddress = amountOutVeldrome.routerAddress
                                      route = amountOutVeldrome.route
                                      factory = amountOutVeldrome.factory
                                    }
                                      }
                                  const amountOutV3Single = await calculateAmountInV3Single(inputValue, tokenAAddress, tokenBAddress, chainId,chainData);
                                  if (amountOutV3Single.bestAmountOut < bestAmountOut && amountOutV3Single.bestAmountOut !== 0n) {
                                    console.log("Updating best route (UniswapV3Single)");
                                    bestAmountOut = amountOutV3Single.bestAmountOut;
                                    dex = amountOutV3Single.Dex;
                                    bestDex = "UniswapV3Single";
                                    routerAddress = amountOutV3Single.routerAddress;
                                    route = amountOutV3Single.route;
                                    fee = amountOutV3Single.fee;
                                    factory = amountOutV3Single.factory
    
                                  }
                                  const amountOutV3 = await calculateAmountInV3(inputValue, tokenAAddress, tokenBAddress, chainId,chainData);
                                  if (amountOutV3.bestAmountOut < bestAmountOut && amountOutV3.bestAmountOut !== 0n) {
                                    console.log("Updating best route (UniswapV3Multi)");
                                    bestAmountOut = amountOutV3.bestAmountOut;
                                    dex = amountOutV3.Dex;
                                    bestDex = "UniswapV3Multi";
                                    routerAddress = amountOutV3.routerAddress;
                                    route = amountOutV3.route;
                                    factory = amountOutV3.factory
    
                                  }
                              
                                  
                              
                                  // Additional check for the selectedChainId
                                  if (chainId === 137) {
                                    const amountOutV3Quickswap = await calculateAmountInV1(inputValue, tokenAAddress, tokenBAddress, chainId,chainData );
                                    if (amountOutV3Quickswap.bestAmountOut < bestAmountOut && amountOutV3Quickswap.bestAmountOut !== 0n) {
                                      console.log("Updating best route (QuickswapMulti)");
                                      bestAmountOut = amountOutV3Quickswap.bestAmountOut;
                                      dex = amountOutV3Quickswap.Dex;
                                      bestDex = "QuickswapMulti";
                                      routerAddress = amountOutV3Quickswap.routerAddress;
                                      route = amountOutV3Quickswap.path;
                                      factory = amountOutV3Quickswap.factory
    
                                    }
                              
                                    const amountOutV3SingleQuickswap = await calculateAmountInV3SingleV1(inputValue, tokenAAddress, tokenBAddress, chainId,chainData);
                                    if (amountOutV3SingleQuickswap.bestAmountOut < bestAmountOut && amountOutV3SingleQuickswap.bestAmountOut !== 0n) {
                                      console.log("Updating best route (Quickswap)");
                                      bestAmountOut = amountOutV3SingleQuickswap.bestAmountOut;
                                      dex = amountOutV3SingleQuickswap.Dex;
                                      bestDex = "Quickswap";
                                      routerAddress = amountOutV3SingleQuickswap.routerAddress;
                                      route = amountOutV3SingleQuickswap.route;
                                      fee = amountOutV3SingleQuickswap.fee
                                      factory = amountOutV3SingleQuickswap.factory
    
                                    }
                                  }
                              
                                  const amountOutV2 = await calculateAmountInV2(inputValue, tokenAAddress, tokenBAddress, chainId,chainData);
                                  if (amountOutV2.bestAmountOut < bestAmountOut && amountOutV2.bestAmountOut !== 0n) {
                                    console.log("Updating best route (UniswapV2)");
                                    bestAmountOut = amountOutV2.bestAmountOut;
                                    dex = amountOutV2.Dex;
                                    bestDex = "Uniswapv2";
                                    routerAddress = amountOutV2.routerAddress;
                                    route = amountOutV2.route;
                                    factory = amountOutV2.factory
    
    
                                  }
                              
                                } catch (error) {
                                  console.error("Error during amountOut calculation:", error);
                                }
                                const bestAmount = bestAmountOut == 999999999999999999999999999999999999999999n ? 0n: bestAmountOut;
        
                                console.log(`Final best amountOut: ${bestAmountOut} from DEX: ${bestDex}`);
                              
                            
                                
                                
                              return {dex:dex, bestAmountOut: bestAmount, bestDex: bestDex, fee:fee, routerAddress: routerAddress, route: route, factory: factory};
                            }
                            export async function getAmountsIn2(
                              tokenIn: Token,
                              tokenOut: Token,
                              chainId: number,
                              inputValue: number,
                          ): Promise<{
                              dex:string;
                              bestAmountOut: bigint;
                              bestDex: BuyingStepDex;
                              fee: number;
                              route: any;
                              routerAddress: string;
                              factory:string;
                            } | null> {
  
                              let bestAmountOut: bigint = 999999999999999999999999999999999999999999n; // Start with the largest possible value
                              let bestDex: BuyingStepDex = "Uniswapv2"; // Default value for bestDex
                              let dex: string = ""; // Default value for bestDex
                              let factory: string = ""; // Default value for bestDex
                              let fee: number = 0;
                              let route: any = "";
                              let routerAddress: string = "";
                              if (!tokenIn || !tokenOut ) {
                              return null; // Return fallback value
                            }
                            const chainData = Object.values(UNISWAP_CONTRACTS2).find(
                              (data) => data.chainId === chainId
                            );
                          
                            if (!chainData) {
                              console.error(`Chain data not found for chainId: ${chainId}`);
                              return null;
                            }
                              const WETH9 = chainData.wrappedAddress;
                              try {
  
                                  if (
                                    (tokenIn.contractAddress.toLowerCase() === WETH9.toLowerCase() && tokenOut.contractAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()) ||
                                          (tokenIn.contractAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase() && tokenOut.contractAddress.toLowerCase() === WETH9.toLowerCase())
                                        ) {
                                    const input = tokenIn.contractAddress === WETH9 ? "Withdraw":"Deposit";
                                          return {dex: "WETH9", bestAmountOut: BigInt(Math.floor(Number(inputValue) * 10 ** 18)), bestDex: "WrappedContract", fee: 0, routerAddress: chainData.wrappedContract,route: input, factory:""   }; // 1:1 rate
                                        }
                                    
                                        // Initialize addresses for tokenA and tokenB
                                        const tokenAAddress:Token =
                                          tokenIn.contractAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase() ? {contractAddress: WETH9 , decimals:18} : tokenIn;
                                        const tokenBAddress:Token =
                                          tokenOut.contractAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase() ? {contractAddress: WETH9 , decimals:18} : tokenOut;
                                    
                                    if (tokenAAddress === tokenBAddress) {
                                      throw new Error("Token addresses are identical. Cannot calculate a path.");
                                    }
                                
                                    
                                    const parsedAmountIn = BigInt(
                                      Math.round(Number(inputValue) * 10 ** tokenBAddress?.decimals)
                                    ); 
                                    if (isAddress(chainData.veldromeRouter)) {
                               
                                  const amountOutVeldrome = await calculateAmountInVeldrome(parsedAmountIn, tokenAAddress, tokenBAddress, chainId, chainData);
                            
                                  if (amountOutVeldrome.bestAmountOut < bestAmountOut && amountOutVeldrome.bestAmountOut !== 0n) {
                                    console.log("Updating best route (Veldrome)");
                                    bestAmountOut = amountOutVeldrome.bestAmountOut;
                                    bestDex = "Veldrome";
                                    dex = "Veldrome";
                                    routerAddress = amountOutVeldrome.routerAddress
                                    route = amountOutVeldrome.route
                                    factory = amountOutVeldrome.factory
                                  }
                                    }
                                const amountOutV3Single = await calculateAmountInV3Single(parsedAmountIn, tokenAAddress, tokenBAddress, chainId,chainData);
                                if (amountOutV3Single.bestAmountOut < bestAmountOut && amountOutV3Single.bestAmountOut !== 0n) {
                                  console.log("Updating best route (UniswapV3Single)");
                                  bestAmountOut = amountOutV3Single.bestAmountOut;
                                  dex = amountOutV3Single.Dex;
                                  bestDex = "UniswapV3Single";
                                  routerAddress = amountOutV3Single.routerAddress;
                                  route = amountOutV3Single.route;
                                  fee = amountOutV3Single.fee;
                                  factory = amountOutV3Single.factory
  
                                }
                                const amountOutV3 = await calculateAmountInV3(parsedAmountIn, tokenAAddress, tokenBAddress, chainId,chainData);
                                if (amountOutV3.bestAmountOut < bestAmountOut && amountOutV3.bestAmountOut !== 0n) {
                                  console.log("Updating best route (UniswapV3Multi)");
                                  bestAmountOut = amountOutV3.bestAmountOut;
                                  dex = amountOutV3.Dex;
                                  bestDex = "UniswapV3Multi";
                                  routerAddress = amountOutV3.routerAddress;
                                  route = amountOutV3.route;
                                  factory = amountOutV3.factory
  
                                }
                            
                                
                            
                                // Additional check for the selectedChainId
                                if (chainId === 137) {
                                  const amountOutV3Quickswap = await calculateAmountInV1(parsedAmountIn, tokenAAddress, tokenBAddress, chainId,chainData );
                                  if (amountOutV3Quickswap.bestAmountOut < bestAmountOut && amountOutV3Quickswap.bestAmountOut !== 0n) {
                                    console.log("Updating best route (QuickswapMulti)");
                                    bestAmountOut = amountOutV3Quickswap.bestAmountOut;
                                    dex = amountOutV3Quickswap.Dex;
                                    bestDex = "QuickswapMulti";
                                    routerAddress = amountOutV3Quickswap.routerAddress;
                                    route = amountOutV3Quickswap.path;
                                    factory = amountOutV3Quickswap.factory
  
                                  }
                            
                                  const amountOutV3SingleQuickswap = await calculateAmountInV3SingleV1(parsedAmountIn, tokenAAddress, tokenBAddress, chainId,chainData);
                                  if (amountOutV3SingleQuickswap.bestAmountOut < bestAmountOut && amountOutV3SingleQuickswap.bestAmountOut !== 0n) {
                                    console.log("Updating best route (Quickswap)");
                                    bestAmountOut = amountOutV3SingleQuickswap.bestAmountOut;
                                    dex = amountOutV3SingleQuickswap.Dex;
                                    bestDex = "Quickswap";
                                    routerAddress = amountOutV3SingleQuickswap.routerAddress;
                                    route = amountOutV3SingleQuickswap.route;
                                    fee = amountOutV3SingleQuickswap.fee
                                    factory = amountOutV3SingleQuickswap.factory
  
                                  }
                                }
                            
                                const amountOutV2 = await calculateAmountInV2(parsedAmountIn, tokenAAddress, tokenBAddress, chainId,chainData);
                                if (amountOutV2.bestAmountOut < bestAmountOut && amountOutV2.bestAmountOut !== 0n) {
                                  console.log("Updating best route (UniswapV2)");
                                  bestAmountOut = amountOutV2.bestAmountOut;
                                  dex = amountOutV2.Dex;
                                  bestDex = "Uniswapv2";
                                  routerAddress = amountOutV2.routerAddress;
                                  route = amountOutV2.route;
                                  factory = amountOutV2.factory
  
  
                                }
                            
                              } catch (error) {
                                console.error("Error during amountOut calculation:", error);
                              }
                              const bestAmount = bestAmountOut == 999999999999999999999999999999999999999999n ? 0n: bestAmountOut;
      
                              console.log(`Final best amountOut: ${bestAmountOut} from DEX: ${bestDex}`);
                            
                          
                              
                              
                            return {dex:dex, bestAmountOut: bestAmount, bestDex: bestDex, fee:fee, routerAddress: routerAddress, route: route, factory: factory};
                          }
                          
  
                          export async function getAmountsOut2(
                              tokenIn: Token,
                              tokenOut: Token,
                              chainId: number,
                              inputValue: number,
                          ): Promise<{
                              dex:string;
                              bestAmountOut: bigint;
                              bestDex: BuyingStepDex;
                              fee: number;
                              route: any;
                              routerAddress: string;
                              factory:string;
                            } | null> {
  
                              let bestAmountOut: bigint = 0n; // Start with the largest possible value
                              let bestDex: BuyingStepDex = "Uniswapv2"; // Default value for bestDex
                              let dex: string = ""; // Default value for bestDex
                              let factory: string = ""; // Default value for bestDex
                              let fee: number = 0;
                              let route: any = "";
                              let routerAddress: string = ""
                              if (!tokenIn || !tokenOut ) {
                              return null; // Return fallback value
                            }
                            const chainData = Object.values(UNISWAP_CONTRACTS2).find(
                              (data) => data.chainId === chainId
                            );
                          
                            if (!chainData) {
                              console.error(`Chain data not found for chainId: ${chainId}`);
                              return null;
                            }
                              const WETH9 = chainData.wrappedAddress;
                              try {
  
                                  if (
                                    (tokenIn.contractAddress.toLowerCase() === WETH9.toLowerCase() && tokenOut.contractAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()) ||
                                     (tokenIn.contractAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase() && tokenOut.contractAddress.toLowerCase() === WETH9.toLowerCase())
                                        ) {
                                    const input = tokenIn.contractAddress === WETH9 ? "Withdraw":"Deposit";
                                          return {dex: "WETH9", bestAmountOut: BigInt(Math.floor(Number(inputValue) * 10 ** 18)), bestDex: "WrappedContract", fee: 0, routerAddress: chainData.wrappedContract,route: input, factory:""   }; // 1:1 rate
                                        }
                                    
                                        // Initialize addresses for tokenA and tokenB
                                        const tokenAAddress:Token =
                                          tokenIn.contractAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase() ? {contractAddress: WETH9 , decimals:18} : tokenIn;
                                        const tokenBAddress:Token =
                                          tokenOut.contractAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase() ? {contractAddress: WETH9 , decimals:18} : tokenOut;
                                    
                                    if (tokenAAddress === tokenBAddress) {
                                      throw new Error("Token addresses are identical. Cannot calculate a path.");
                                    }
                                
                                    
                                    const parsedAmountIn = BigInt(
                                      Math.round(Number(inputValue) * 10 ** tokenAAddress?.decimals)
                                    ); 
                                    console.log("inputAmount",parsedAmountIn);
                               if (isAddress(chainData.veldromeRouter)) {
                                  const amountOutVeldrome = await calculateAmountOutVeldrome(parsedAmountIn, tokenAAddress, tokenBAddress, chainId, chainData);
                            
                                  if (amountOutVeldrome.bestAmountOut > bestAmountOut && amountOutVeldrome.bestAmountOut !== 0n) {
                                    console.log("Updating best route (Veldrome)");
                                    bestAmountOut = amountOutVeldrome.bestAmountOut;
                                    bestDex = "Veldrome";
                                    dex = "Veldrome";
                                    routerAddress = amountOutVeldrome.routerAddress;
                                    route = amountOutVeldrome.route;
                                    factory = amountOutVeldrome.factory;
  
                                  }
                                  console.log("router", routerAddress)
                                }
                                const amountOutV3Single = await calculateAmountOutV3Single(parsedAmountIn, tokenAAddress, tokenBAddress, chainId,chainData);
                                if (amountOutV3Single.bestAmountOut > bestAmountOut && amountOutV3Single.bestAmountOut !== 0n) {
                                  console.log("Updating best route (UniswapV3Single)");
                                  bestAmountOut = amountOutV3Single.bestAmountOut;
                                  dex = amountOutV3Single.Dex;
                                  bestDex = "UniswapV3Single";
                                  routerAddress = amountOutV3Single.routerAddress;
                                  route = amountOutV3Single.route;
                                  fee = amountOutV3Single.fee;
                                  factory = amountOutV3Single.factory;
  
                                }
                                if (amountOutV3Single.bestAmountOut === 0n ) {
                                const amountOutV3 = await calculateAmountOutV3(parsedAmountIn, tokenAAddress, tokenBAddress, chainId,chainData);
                                if (amountOutV3.bestAmountOut > bestAmountOut && amountOutV3.bestAmountOut !== 0n) {
                                  console.log("Updating best route (UniswapV3Multi)", routerAddress);
                                  bestAmountOut = amountOutV3.bestAmountOut;
                                  dex = amountOutV3.Dex;
                                  bestDex = "UniswapV3Multi";
                                  routerAddress = amountOutV3.routerAddress;
                                  route = amountOutV3.route;
                                  factory = amountOutV3.factory;
  
                                }
                              }
                                console.log("router", routerAddress)
                            
                                // Additional check for the selectedChainId
                                if (chainId === 137) {
                                  const amountOutV3SingleQuickswap = await calculateAmountOutV3SingleV1(parsedAmountIn, tokenAAddress, tokenBAddress, chainId,chainData);
                                  if (amountOutV3SingleQuickswap.bestAmountOut > bestAmountOut && amountOutV3SingleQuickswap.bestAmountOut !== 0n) {
                                    console.log("Updating best route (Quickswap)");
                                    bestAmountOut = amountOutV3SingleQuickswap.bestAmountOut;
                                    dex = amountOutV3SingleQuickswap.Dex;
                                    bestDex = "Quickswap";
                                    routerAddress = amountOutV3SingleQuickswap.routerAddress;
                                  route = amountOutV3SingleQuickswap.route;
                                  fee= amountOutV3SingleQuickswap.fee
                                  factory = amountOutV3SingleQuickswap.factory;
  
                                  }
                                  const amountOutV3Quickswap = await calculateAmountOutV3V1(parsedAmountIn, tokenAAddress, tokenBAddress, chainId,chainData );
                                  if (amountOutV3Quickswap.bestAmountOut > bestAmountOut && amountOutV3Quickswap.bestAmountOut !== 0n) {
                                    console.log("Updating best route (QuickswapMulti)");
                                    bestAmountOut = amountOutV3Quickswap.bestAmountOut;
                                    dex = amountOutV3Quickswap.Dex;
                                    bestDex = "QuickswapMulti";
                                    routerAddress = amountOutV3Quickswap.routerAddress;
                                  route = amountOutV3Quickswap.route;
                                  factory = amountOutV3Quickswap.factory;
  
                                  }
                                  
  
                                }
  
                                const amountOutV2 = await calculateAmountOutV2(parsedAmountIn, tokenAAddress, tokenBAddress, chainId,chainData);
                                if (amountOutV2.bestAmountOut > bestAmountOut && amountOutV2.bestAmountOut !== 0n) {
                                  console.log("Updating best route (UniswapV2)");
                                  bestAmountOut = amountOutV2.bestAmountOut;
                                  dex = amountOutV2.Dex;
                                  bestDex = "Uniswapv2";
                                  routerAddress = amountOutV2.routerAddress;
                                  route = amountOutV2.route;
                                  factory = amountOutV2.factory;
  
                                }
                                console.log("router", routerAddress)
  
                              } catch (error) {
                                console.error("Error during amountOut calculation:", error);
                              }
      
                              console.log(`Final best amountOut: ${bestAmountOut} from DEX: ${bestDex} contract: ${routerAddress}`);
          
                            return {dex: dex,bestAmountOut: bestAmountOut, bestDex: bestDex, fee: fee, routerAddress: routerAddress ,route: route, factory: factory};
                          }
  
    
                            export async function getAmountsOut(
                                tokenIn: Token,
                                tokenOut: Token,
                                chainId: number,
                                inputValue: bigint,
                            ): Promise<{
                                dex:string;
                                bestAmountOut: bigint;
                                bestDex: BuyingStepDex;
                                fee: number;
                                route: any;
                                routerAddress: string;
                                factory:string;
                              } | null> {
    
                                let bestAmountOut: bigint = 0n; // Start with the largest possible value
                                let bestDex: BuyingStepDex = "Uniswapv2"; // Default value for bestDex
                                let dex: string = ""; // Default value for bestDex
                                let factory: string = ""; // Default value for bestDex
                                let fee: number = 0;
                                let route: any = "";
                                let routerAddress: string = ""
                                if (!tokenIn || !tokenOut ) {
                                return null; // Return fallback value
                              }
                              const parsedAmountIn = inputValue;

                              if (parsedAmountIn == 0n) return null;

                              const chainData = Object.values(UNISWAP_CONTRACTS2).find(
                                (data) => data.chainId === chainId
                              );
                            
                              if (!chainData) {
                                console.error(`Chain data not found for chainId: ${chainId}`);
                                return null;
                              }
                                const WETH9 = chainData.wrappedAddress;
                                try {
    
                                    if (
                                      (tokenIn.contractAddress.toLowerCase() === WETH9.toLowerCase() && tokenOut.contractAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()) ||
                                        (tokenIn.contractAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase() && tokenOut.contractAddress.toLowerCase() === WETH9.toLowerCase())
                                      ) {
                                  const input = tokenIn.contractAddress === WETH9 ? "Withdraw":"Deposit";
                                        return {dex: "WETH9", bestAmountOut: BigInt(Math.floor(Number(inputValue) * 10 ** 18)), bestDex: "WrappedContract", fee: 0, routerAddress: chainData.wrappedContract,route: input, factory:""   }; // 1:1 rate
                                      }
                                  
                                      // Initialize addresses for tokenA and tokenB
                                      const tokenAAddress:Token =
                                        tokenIn.contractAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase() ? {contractAddress: WETH9 , decimals:18} : tokenIn;
                                      const tokenBAddress:Token =
                                        tokenOut.contractAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase() ? {contractAddress: WETH9 , decimals:18} : tokenOut;
                                  
                                      if (tokenAAddress === tokenBAddress) {
                                        throw new Error("Token addresses are identical. Cannot calculate a path.");
                                      }
                                  
                                      
                                      
                                 if (isAddress(chainData.veldromeRouter)) {
                                    const amountOutVeldrome = await calculateAmountOutVeldrome(parsedAmountIn, tokenAAddress, tokenBAddress, chainId, chainData);
                              
                                    if (amountOutVeldrome.bestAmountOut > bestAmountOut && amountOutVeldrome.bestAmountOut !== 0n) {
                                      console.log("Updating best route (Veldrome)");
                                      bestAmountOut = amountOutVeldrome.bestAmountOut;
                                      bestDex = "Veldrome";
                                      dex = "Veldrome";
                                      routerAddress = amountOutVeldrome.routerAddress;
                                      route = amountOutVeldrome.route;
                                      factory = amountOutVeldrome.factory;
    
                                    }
                                    console.log("router", routerAddress)
                                  }
                                  const amountOutV3Single = await calculateAmountOutV3Single(parsedAmountIn, tokenAAddress, tokenBAddress, chainId,chainData);
                                  if (amountOutV3Single.bestAmountOut > bestAmountOut && amountOutV3Single.bestAmountOut !== 0n) {
                                    console.log("Updating best route (UniswapV3Single)");
                                    bestAmountOut = amountOutV3Single.bestAmountOut;
                                    dex = amountOutV3Single.Dex;
                                    bestDex = "UniswapV3Single";
                                    routerAddress = amountOutV3Single.routerAddress;
                                    route = amountOutV3Single.route;
                                    fee = amountOutV3Single.fee;
                                    factory = amountOutV3Single.factory;
    
                                  }
                                  if (amountOutV3Single.bestAmountOut === 0n ) {
                                  const amountOutV3 = await calculateAmountOutV3(parsedAmountIn, tokenAAddress, tokenBAddress, chainId,chainData);
                                  if (amountOutV3.bestAmountOut > bestAmountOut && amountOutV3.bestAmountOut !== 0n) {
                                    console.log("Updating best route (UniswapV3Multi)", routerAddress);
                                    bestAmountOut = amountOutV3.bestAmountOut;
                                    dex = amountOutV3.Dex;
                                    bestDex = "UniswapV3Multi";
                                    routerAddress = amountOutV3.routerAddress;
                                    route = amountOutV3.route;
                                    factory = amountOutV3.factory;
    
                                  }
                                }
                                  console.log("router", routerAddress)
                              
                                  // Additional check for the selectedChainId
                                  if (chainId === 137) {
                                    const amountOutV3SingleQuickswap = await calculateAmountOutV3SingleV1(parsedAmountIn, tokenAAddress, tokenBAddress, chainId,chainData);
                                    if (amountOutV3SingleQuickswap.bestAmountOut > bestAmountOut && amountOutV3SingleQuickswap.bestAmountOut !== 0n) {
                                      console.log("Updating best route (Quickswap)");
                                      bestAmountOut = amountOutV3SingleQuickswap.bestAmountOut;
                                      dex = amountOutV3SingleQuickswap.Dex;
                                      bestDex = "Quickswap";
                                      routerAddress = amountOutV3SingleQuickswap.routerAddress;
                                    route = amountOutV3SingleQuickswap.route;
                                    fee= amountOutV3SingleQuickswap.fee
                                    factory = amountOutV3SingleQuickswap.factory;
    
                                    }
                                    const amountOutV3Quickswap = await calculateAmountOutV3V1(parsedAmountIn, tokenAAddress, tokenBAddress, chainId,chainData );
                                    if (amountOutV3Quickswap.bestAmountOut > bestAmountOut && amountOutV3Quickswap.bestAmountOut !== 0n) {
                                      console.log("Updating best route (QuickswapMulti)");
                                      bestAmountOut = amountOutV3Quickswap.bestAmountOut;
                                      dex = amountOutV3Quickswap.Dex;
                                      bestDex = "QuickswapMulti";
                                      routerAddress = amountOutV3Quickswap.routerAddress;
                                    route = amountOutV3Quickswap.route;
                                    factory = amountOutV3Quickswap.factory;
    
                                    }
                                    
    
                                  }
    
                                  const amountOutV2 = await calculateAmountOutV2(parsedAmountIn, tokenAAddress, tokenBAddress, chainId,chainData);
                                  if (amountOutV2.bestAmountOut > bestAmountOut && amountOutV2.bestAmountOut !== 0n) {
                                    console.log("Updating best route (UniswapV2)");
                                    bestAmountOut = amountOutV2.bestAmountOut;
                                    dex = amountOutV2.Dex;
                                    bestDex = "Uniswapv2";
                                    routerAddress = amountOutV2.routerAddress;
                                    route = amountOutV2.route;
                                    factory = amountOutV2.factory;
    
                                  }
                                  console.log("router", routerAddress)
    
                                } catch (error) {
                                  console.error("Error during amountOut calculation:", error);
                                }
        
                                console.log(`Final best amountOut: ${bestAmountOut} from DEX: ${bestDex} contract: ${routerAddress}`);
            
                              return {dex: dex,bestAmountOut: bestAmountOut, bestDex: bestDex, fee: fee, routerAddress: routerAddress ,route: route, factory: factory};
                            }
    
                            export function formatBalance(balance: string) {
                              if (!balance) return "0.00"; // Fallback for empty balance
                            
                              const balanceValue = parseFloat(balance);
                            
                              // If balance is larger than 1, format with 2 decimal places
                              if (balanceValue >= 1) {
                                return balanceValue.toFixed(2);
                              }
                            
                              // For smaller balances, display up to 7 significant digits
                              return balanceValue.toPrecision(7);
                            }

                          export const isVideoUrl = (url: string) => {
                              const videoExtensions = [".mp4", ".mov", ".webm", ".mkv"];
                              return videoExtensions.some((ext) => url.toLowerCase().endsWith(ext));
                            };
                            const findToken = (address: string, tokenBalances: Token2[]): Token2 | undefined => {
                                                              return tokenBalances.find(
                                                                (token) =>
                                                                  token.contractAddress.toLowerCase() === address.toLowerCase()
                                                              );
                                                            };
                                
                                                            export const fetchPath = async (
                                                              route: any,
                                                              tokenA: Token2,
                                                              tokenB: Token2,
                                                              amountIn: string,
                                                              amountOut: string,
                                                              dexStep: string,
                                                              tokenBalances: Token2[],
                                                              currentFrom: string
                                                            ) => {
                                                              console.log('fetchPath called with:', {
                                                                route,
                                                                tokenA,
                                                                tokenB,
                                                                amountIn,
                                                                amountOut,
                                                                dexStep,
                                                                tokenBalancesLength: tokenBalances.length,
                                                                currentFrom,
                                                              });
                                                            
                                                              let path: any = [];
                                                            
                                                              // Early return checks
                                                              if (!tokenA || !tokenB) {
                                                                console.log('Early return: tokenA or tokenB is missing', { tokenA, tokenB });
                                                                return path;
                                                              }
                                                            
                                                              if (Number(amountIn) <= 0 || Number(amountOut) <= 0) {
                                                                console.log('Early return: Invalid amounts', { amountIn, amountOut });
                                                                return path;
                                                              }
                                                            
                                                              try {
                                                                if (dexStep === "Uniswapv2" && Array.isArray(route)) {
                                                                  console.log('Processing Uniswapv2 route, route length:', route.length);
                                                                  if (route.length === 2) {
                                                                    path = [
                                                                      { token: tokenA },
                                                                      { token: tokenB },
                                                                    ];
                                                                  } else if (route.length === 3) {
                                                                    console.log('Looking up intermediate token:', route[1]);
                                                                    const intermediateToken = await findToken(route[1], tokenBalances);
                                                                    if (!intermediateToken) {
                                                                      console.log('Intermediate token not found:', route[1]);
                                                                      return path; // Return empty path if token not found
                                                                    }
                                                                    console.log('Intermediate token result:', intermediateToken);
                                                                    path = [
                                                                      { token: tokenA },
                                                                      { token: intermediateToken },
                                                                      { token: tokenB },
                                                                    ];
                                                                  } else if (route.length === 4) {
                                                                    console.log('Looking up intermediate tokens:', route[1], route[2]);
                                                                    const intermediateToken1 = await findToken(route[1], tokenBalances);
                                                                    const intermediateToken2 = await findToken(route[2], tokenBalances);
                                                                    if (!intermediateToken1 || !intermediateToken2) {
                                                                      console.log('One or more intermediate tokens not found:', { intermediateToken1, intermediateToken2 });
                                                                      return path; // Return empty path if any token not found
                                                                    }
                                                                    console.log('Intermediate token results:', { intermediateToken1, intermediateToken2 });
                                                                    path = [
                                                                      { token: tokenA },
                                                                      { token: intermediateToken1 },
                                                                      { token: intermediateToken2 },
                                                                      { token: tokenB },
                                                                    ];
                                                                  }
                                                                } else if (dexStep === "transfer" && Array.isArray(route)) {
                                                                  console.log('Processing transfer route, route length:', route.length);
                                                                  if (route.length === 2) {
                                                                    path = [
                                                                      { token: tokenA },
                                                                      { token: tokenB },
                                                                    ];
                                                                  } else if (route.length === 3) {
                                                                    console.log('Looking up intermediate token:', route[1]);
                                                                    const intermediateToken = await findToken(route[1], tokenBalances);
                                                                    if (!intermediateToken) {
                                                                      console.log('Intermediate token not found:', route[1]);
                                                                      return path; // Return empty path if token not found
                                                                    }
                                                                    console.log('Intermediate token result:', intermediateToken);
                                                                    path = [
                                                                      { token: tokenA },
                                                                      { token: intermediateToken },
                                                                      { token: tokenB },
                                                                    ];
                                                                  } else if (route.length === 4) {
                                                                    console.log('Looking up intermediate tokens:', route[1], route[2]);
                                                                    const intermediateToken1 = await findToken(route[1], tokenBalances);
                                                                    const intermediateToken2 = await findToken(route[2], tokenBalances);
                                                                    if (!intermediateToken1 || !intermediateToken2) {
                                                                      console.log('One or more intermediate tokens not found:', { intermediateToken1, intermediateToken2 });
                                                                      return path; // Return empty path if any token not found
                                                                    }
                                                                    console.log('Intermediate token results:', { intermediateToken1, intermediateToken2 });
                                                                    path = [
                                                                      { token: tokenA },
                                                                      { token: intermediateToken1 },
                                                                      { token: intermediateToken2 },
                                                                      { token: tokenB },
                                                                    ];
                                                                  }
                                                                } else if (dexStep === "UniswapV3Single" || dexStep === "Quickswap") {
                                                                  console.log('Processing UniswapV3Single or Quickswap route');
                                                                  path = [
                                                                    { token: tokenA },
                                                                    { token: tokenB },
                                                                  ];
                                                                } else if (dexStep === "QuickswapMulti") {
                                                                  console.log('Processing QuickswapMulti route');
                                                                  const decodedPath = validatePath(route, 2);
                                                                  console.log('validatePath result:', decodedPath);
                                                                  if (decodedPath) {
                                                                    console.log('Looking up intermediate token:', decodedPath[1]);
                                                                    const intermediateToken = await findToken(decodedPath[1], tokenBalances);
                                                                    if (!intermediateToken) {
                                                                      console.log('Intermediate token not found:', decodedPath[1]);
                                                                      return path;
                                                                    }
                                                                    console.log('Intermediate token result:', intermediateToken);
                                                                    path = [
                                                                      { token: tokenA },
                                                                      { token: intermediateToken },
                                                                      { token: tokenB },
                                                                    ];
                                                                  }
                                                                } else if (dexStep === "UniswapV3Multi") {
                                                                  console.log('Processing UniswapV3Multi route');
                                                                  let decodedPath = validateUniswapV3Path(route, 2);
                                                                  console.log('validateUniswapV3Path (2 hops) result:', decodedPath);
                                                                  if (decodedPath) {
                                                                    console.log('Looking up intermediate token:', decodedPath[2]);
                                                                    const intermediateToken = await findToken(decodedPath[2], tokenBalances);
                                                                    if (!intermediateToken) {
                                                                      console.log('Intermediate token not found:', decodedPath[2]);
                                                                      return path;
                                                                    }
                                                                    console.log('Intermediate token result:', intermediateToken);
                                                                    path = [
                                                                      { token: tokenA },
                                                                      { token: intermediateToken },
                                                                      { token: tokenB },
                                                                    ];
                                                                  } else {
                                                                    decodedPath = validateUniswapV3Path(route, 3);
                                                                    console.log('validateUniswapV3Path (3 hops) result:', decodedPath);
                                                                    if (decodedPath) {
                                                                      console.log('Looking up intermediate tokens:', decodedPath[2], decodedPath[4]);
                                                                      const intermediateToken1 = await findToken(decodedPath[2], tokenBalances);
                                                                      const intermediateToken2 = await findToken(decodedPath[4], tokenBalances);
                                                                      if (!intermediateToken1 || !intermediateToken2) {
                                                                        console.log('One or more intermediate tokens not found:', { intermediateToken1, intermediateToken2 });
                                                                        return path;
                                                                      }
                                                                      console.log('Intermediate token results:', { intermediateToken1, intermediateToken2 });
                                                                      path = [
                                                                        { token: tokenA },
                                                                        { token: intermediateToken1 },
                                                                        { token: intermediateToken2 },
                                                                        { token: tokenB },
                                                                      ];
                                                                    }
                                                                  }
                                                                } else {
                                                                  console.log('Processing default case route');
                                                                  const decodedPath = validatePath(route, 3);
                                                                  console.log('validatePath (default case) result:', decodedPath);
                                                                  if (decodedPath) {
                                                                    console.log('Looking up intermediate tokens:', decodedPath[1], decodedPath[2]);
                                                                    const intermediateToken1 = await findToken(decodedPath[1], tokenBalances);
                                                                    const intermediateToken2 = await findToken(decodedPath[2], tokenBalances);
                                                                    if (!intermediateToken1 || !intermediateToken2) {
                                                                      console.log('One or more intermediate tokens not found:', { intermediateToken1, intermediateToken2 });
                                                                      return path;
                                                                    }
                                                                    console.log('Intermediate token results:', { intermediateToken1, intermediateToken2 });
                                                                    path = [
                                                                      { token: tokenA },
                                                                      { token: intermediateToken1 },
                                                                      { token: intermediateToken2 },
                                                                      { token: tokenB },
                                                                    ];
                                                                  }
                                                                }
                                                              } catch (error) {
                                                                console.error('Unexpected error in fetchPath:', error);
                                                              }
                                                            
                                                              console.log('Final path:', path);
                                                              return path;
                                                            };

                            export function decodeSwapPath(path: string, hopLength: number = 20): string[] {
                              if (!ethers.utils.isHexString(path)) {
                                throw new Error("Invalid path: not a hexadecimal string.");
                              }
                            
                              const addresses: string[] = [];
                              for (let i = 0; i < path.length - 2; i += hopLength * 2) {
                                const token = "0x" + path.slice(2 + i, 2 + i + hopLength * 2);
                                addresses.push(token);
                              }
                              return addresses;
                            }
                            export function validatePath(path: string, numAddresses: number): string[] | null {
                              try {
                                const decodedPath = decodeSwapPath(path); // Decode the path
                                if (decodedPath.length === numAddresses) {
                                  return decodedPath; // Valid path
                                }
                                return null; // Mismatched number of addresses
                              } catch (error) {
                                console.error(`Error decoding path:`, error);
                                return null; // Decoding failed
                              }
                            }
                            export function decodeUniswapV3Path(path: string): string[] {
                              console.log("Starting to decode Uniswap V3 path:", path);
                            
                              if (!ethers.utils.isHexString(path)) {
                                console.error("Invalid path: not a hexadecimal string.");
                                throw new Error("Invalid path: not a hexadecimal string.");
                              }
                            
                              const result: string[] = [];
                              const addressSize = 20 * 2; // 40 characters for an address
                              const feeSize = 3 * 2; // 6 characters for a fee
                              let offset = 2; // Skip the "0x" prefix
                            
                              console.log("Path is valid hexadecimal string. Starting decoding...");
                            
                              while (offset < path.length) {
                                // Check if there's enough data for an address
                                if (offset + addressSize > path.length) {
                                  console.error("Incomplete address at offset:", offset);
                                  throw new Error("Invalid path: incomplete address.");
                                }
                            
                                // Extract token address
                                const token = "0x" + path.slice(offset, offset + addressSize);
                                console.log("Extracted token:", token);
                                result.push(token);
                                offset += addressSize;
                            
                                // Check if there's enough data for a fee
                                if (offset + feeSize <= path.length) {
                                  const fee = path.slice(offset, offset + feeSize);
                                  console.log("Extracted fee:", fee);
                                  result.push(fee);
                                  offset += feeSize;
                                } else if (offset < path.length) {
                                  console.warn("Incomplete fee at offset:", offset);
                                  throw new Error("Invalid path: incomplete fee.");
                                }
                              }
                            
                              console.log("Decoded path:", result);
                              return result;
                            }
                            
                            export function decodeUniswapV3Path2(path: string): string[] {
                              console.log("Starting to decode Uniswap V3 path:", path);
                            
                              if (!ethers.utils.isHexString(path)) {
                                console.error("Invalid path: not a hexadecimal string.");
                                throw new Error("Invalid path: not a hexadecimal string.");
                              }
                            
                              const result: string[] = [];
                              const addressSize = 20 * 2; // Address size in hex (20 bytes * 2 chars per byte)
                              const feeSize = 3 * 2; // Fee size in hex (3 bytes * 2 chars per byte)
                              let offset = 2; // Start after "0x"
                            
                              console.log("Path is valid hexadecimal string. Starting decoding...");
                            
                              while (offset < path.length) {
                                // Extract address
                                const token = "0x" + path.slice(offset, offset + addressSize);
                                console.log(`Extracted token address: ${token}`);
                                result.push(token);
                                offset += addressSize;
                            
                                // Extract fee if there's more data
                                if (offset < path.length) {
                                  const fee = parseInt(path.slice(offset, offset + feeSize), 16);
                                  console.log(`Extracted fee: ${fee}`);
                                  result.push(`${fee}`); // Add fee as a string
                                  offset += feeSize;
                                }
                              }
                            
                              console.log("Decoded path:", result);
                              return result;
                            }
                            
                            export function validateUniswapV3Path(path: string, numHops: number): string[] | null {
                              console.log("Validating Uniswap V3 path with numHops:", numHops);
                            
                              try {
                                const decodedPath = decodeUniswapV3Path(path); // Decode the path
                                const expectedLength = numHops * 2 + 1; // For n hops: n+1 tokens, n fees
                                console.log(`Decoded path length: ${decodedPath.length}, Expected length: ${expectedLength}`);
                            
                                if (decodedPath.length === expectedLength) {
                                  console.log("Path is valid.");
                                  return decodedPath; // Valid path
                                } else {
                                  console.error("Path length mismatch. Invalid path.");
                                  return null; // Mismatched length
                                }
                              } catch (error) {
                                console.error("Error decoding Uniswap V3 path:", error);
                                return null; // Decoding failed
                              }
                            }
                            
                            
                            