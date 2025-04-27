import { ImageSourcePropType } from "react-native";



export interface ContractMetadata {
  id: string; // Changed to string for JSON serialization
  name: string;
  description: string;
  image: string;
  animation_url?: string;
  vrm_file?: string;
  ranking?: any;
  attributes: Attribute[];
  owner: string;
  tokenUri: string;
  contractAddress?: string;
  chainId?: number;
}
export interface SocialUrl {
  name: string;
  url: string;
}
export interface Token {
  chainId: number;
  contractAddress: string;
  name: string;
  symbol: string;
  decimals: number;
  image: string | ImageSourcePropType;
  balance?: string;
  price?: string;
  value?: string;
  totalSupply?: string;
  volume?: string;
  marketCup?: string;
  totalReverse?: string;
  coinGeckoId?: string;
  topPools?: string[];
}

 export type Networks = {
    name: string;
    chainId: number;
    image: ImageSourcePropType;
    nativeToken: Token;
    USDC: Token;
    wrappedBTC: Token;
    wrappedETH: Token;
  };
  export interface Market {
    question: string;
    optionA: string;
    optionB: string;
    endTime: string;
    outcome: string;
    totalOptionAShares: number;
    totalOptionBShares: number;
    resolved: boolean;
  }
  
  export interface RouterContract {
  name: string;
  router?: string;
  routerV1?: string;
  factory?: string;
  quoterV2?: string;
  quoterV1?: string;
  }
  export interface Attribute {
    trait_type: string;
    value: string | number;
    frequency?: string;
    count?: number;
    image?: string;
  }
  
  // Define the ChainContractData interface to handle chain-specific contract data.
  export interface ChainContractData {
  chainName: string;
  chainId: number;
  factory: string;
  router: string;
  wrappedToken: string;
  wrappedAddress: string;
  wrappedContract: string;
  usdcAddress: string;
  symbol: string;
  dex: {}[];
  liquidityTokens: {
    name: string;
    address: string;
    stable: boolean;
  }[];
  MarketplaceContract: string;
  veldromeRouter:string;
  veldromeFactory:string;
  UniswapV3: RouterContract[]; // Optional for UniswapV3
  UniswapV2: RouterContract[]; 
  nativeToken: Token2;
  factoryAddresses: {
    name: string;
    address: string;
  }[];
  }
  export interface UserProfile {
    name: string;
    info: string;
    location: string;
    receiverAddress: string; // Corrected spelling to match standard convention
    profileImage?: string;
    userId: string;
    isUser: boolean;
    socialUrls?: SocialUrl[];
  }
  
  const worldChain = "0x8D03Dc659Ddf00afDCeF8f898b146B3A5c06B384";
  const worldChainMarketplace = "0xD9e5dc05ef2738AD7424d6e2103CFB49bD653C8B";
  const zora = "0x8D03Dc659Ddf00afDCeF8f898b146B3A5c06B384";
  const zoramaretplace = "0x2fa18F14D0B3a0e5992A97bD3155e0828ae33304";
  const blast = "0x8d03dc659ddf00afdcef8f898b146b3a5c06b384";
  const blastmarketokace = "0x3caac3a88789e6b1ad4b220546b7cc6317bf9516";
  const avalanche = "0x8D03Dc659Ddf00afDCeF8f898b146B3A5c06B384";
  const avalanchemarketplace = "0x370Aa39286447F443D99711Ad3B0F2d1370344A7";
  const unichainmarketplace = "0x9075b6BE9c052dD70F71e7E6E65da06c89205432";
  const unichain = "0x8d03dc659ddf00afdcef8f898b146b3a5c06b384";
  
  export type Token2 = {
    name: string;
    symbol: string;
    contractAddress: string;
    image: string | ImageSourcePropType ;
    chainId?: number;
    price?: string;
    value?: string;
    balance?: string;
    coinGecko?: string;
    hasTax?: boolean;
    decimals: number;
  };
  
  
  export const chainData: { [key: string]: Networks } = {
    Iotex: {
      name: "Iotex",
      chainId: 4689,
      image: require("@/assets/tokenImages/iotx.png"),
      nativeToken: {
        contractAddress: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        chainId: 4689,
        name: "Iotex",
        symbol: "IOTX",
        decimals: 18,
        image: require("@/assets/tokenImages/iotx.png"),
      },
      USDC: {
        contractAddress: "0xcdf79194c6c285077a58da47641d4dbe51f63542",
        chainId: 4689,
        name: "USDC",
        symbol: "USDC",
        decimals: 6,
        image: require("@/assets/tokenImages/usdc.png"),
      },
      wrappedETH: {
        contractAddress: "0x0258866edaf84d6081df17660357ab20a07d0c80",
        chainId: 4689,
        name: "WETH",
        symbol: "WETH",
        decimals: 18,
        image: require("@/assets/tokenImages/eth.png"),
      },
      wrappedBTC: {
        contractAddress: "0xc7b93720f73b037394ce00f954f849ed484a3dea",
        chainId: 4689,
        name: "Wrapped Bitcoin",
        symbol: "WBTC",
        decimals: 18,
        image: require("@/assets/tokenImages/wbtc.png"),
      },
    },
    Ethereum: {
      name: "Ethereum",
      chainId: 1,
      image: require("@/assets/tokenImages/eth.png"),
      nativeToken: {
        contractAddress: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        chainId: 1,
        name: "Ethereum",
        symbol: "ETH",
        decimals: 18,
        image: require("@/assets/tokenImages/eth.png"),
      },
      USDC: {
        contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        chainId: 1,
        name: "USDC",
        symbol: "USDC",
        decimals: 6,
        image: require("@/assets/tokenImages/usdc.png"),
      },
      wrappedETH: {
        contractAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        chainId: 1,
        name: "WETH",
        symbol: "WETH",
        decimals: 18,
        image: require("@/assets/tokenImages/eth.png"),
      },
      wrappedBTC: {
        contractAddress: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
        chainId: 1,
        name: "Wrapped Bitcoin",
        symbol: "WBTC",
        decimals: 8,
        image: require("@/assets/tokenImages/wbtc.png"),
      },
    },
    BNBChain: {
      name: "Binance",
      chainId: 56,
      image: require("@/assets/tokenImages/bnb.png"),
      nativeToken: {
        contractAddress: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        chainId: 56,
        name: "Binance",
        symbol: "BNB",
        decimals: 18,
        image: require("@/assets/tokenImages/bnb.png"),
      },
      USDC: {
        contractAddress: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
        chainId: 56,
        name: "USDC",
        symbol: "USDC",
        decimals: 6,
        image: require("@/assets/tokenImages/usdc.png"),
      },
      wrappedETH: {
        contractAddress: "0x2416092f143378750bb29b79eD961ab195CcEea5",
        chainId: 56,
        name: "WETH",
        symbol: "WETH",
        decimals: 18,
        image: require("@/assets/tokenImages/eth.png"),
      },
      wrappedBTC: {
        contractAddress: "0x0555E30da8f98308EdB960aa94C0Db47230d2B9c",
        chainId: 56,
        name: "Wrapped Bitcoin",
        symbol: "WBTC",
        decimals: 18,
        image: require("@/assets/tokenImages/wbtc.png"),
      },
    },
    Base: {
      name: "Base",
      chainId: 8453,
      image: require("@/assets/tokenImages/base.png"),
      nativeToken: {
        contractAddress: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        chainId: 8453,
        name: "Ethereum",
        symbol: "ETH",
        decimals: 18,
        image: require("@/assets/tokenImages/eth.png"),
      },
      USDC: {
        contractAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        chainId: 8453,
        name: "USDC",
        symbol: "USDC",
        decimals: 6,
        image: require("@/assets/tokenImages/usdc.png"),
      },
      wrappedETH: {
        contractAddress: "0x4200000000000000000000000000000000000006",
        chainId: 8453,
        name: "WETH",
        symbol: "WETH",
        decimals: 18,
        image: require("@/assets/tokenImages/eth.png"),
      },
      wrappedBTC: {
        contractAddress: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf", // Placeholder; update if available
        chainId: 8453,
        name: "Wrapped Bitcoin",
        symbol: "WBTC",
        decimals: 18,
        image: require("@/assets/tokenImages/wbtc.png"),
      },
    },
    Polygon: {
      name: "Polygon",
      chainId: 137,
      image: require("@/assets/tokenImages/matic.png"),
      nativeToken: {
        contractAddress: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        chainId: 137,
        name: "Polygon",
        symbol: "POL",
        decimals: 18,
        image: require("@/assets/tokenImages/matic.png"),
      },
      USDC: {
        contractAddress: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
        chainId: 137,
        name: "USDC",
        symbol: "USDC",
        decimals: 6,
        image: require("@/assets/tokenImages/usdc.png"),
      },
      wrappedETH: {
        contractAddress: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
        chainId: 137,
        name: "WETH",
        symbol: "WETH",
        decimals: 18,
        image: require("@/assets/tokenImages/eth.png"),
      },
      wrappedBTC: {
        contractAddress: "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6",
        chainId: 137,
        name: "Wrapped Bitcoin",
        symbol: "WBTC",
        decimals: 8,
        image: require("@/assets/tokenImages/wbtc.png"),
      },
    },
    Optimism: {
      name: "Optimism",
      chainId: 10,
      image: require("@/assets/tokenImages/op.png"),
      nativeToken: {
        contractAddress: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        chainId: 10,
        name: "Ethereum",
        symbol: "ETH",
        decimals: 18,
        image: require("@/assets/tokenImages/eth.png"),
      },
      USDC: {
        contractAddress: "0x0b2c639c533813f4aa9d7837caf62653d097ff85",
        chainId: 10,
        name: "USDC",
        symbol: "USDC",
        decimals: 6,
        image: require("@/assets/tokenImages/usdc.png"),
      },
      wrappedETH: {
        contractAddress: "0x4200000000000000000000000000000000000006",
        chainId: 10,
        name: "WETH",
        symbol: "WETH",
        decimals: 18,
        image: require("@/assets/tokenImages/eth.png"),
      },
      wrappedBTC: {
        contractAddress: "0x68f180fcCe6836688e9084f035309E29Bf0A2095", // Placeholder; update if available
        chainId: 10,
        name: "Wrapped Bitcoin",
        symbol: "WBTC",
        decimals: 18,
        image: require("@/assets/tokenImages/wbtc.png"),
      },
    },
  };


  export const UNISWAP_CONTRACTS2: { [key: string]: ChainContractData } = {
    Iotex: {
      chainName: "Iotex",
      chainId: 4689,
      factory: "0xda257cBe968202Dea212bBB65aB49f174Da58b9D",
      router: "0xc641d11ee1776d471194b18e021863cca41f92a1",
      nativeToken: {
        contractAddress: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        chainId: 4689,
        name: "Iotex",
        symbol: "iotx", 
        decimals: 18,
        image:  require("@/assets/tokenImages/iotx.png"), // Replace with a proper image
      }, 
      wrappedToken: "WIOTX",
      MarketplaceContract: "0xF87c2066577f2e1c799C4e5628d578B623F5481f",
      wrappedAddress: "0xA00744882684C3e4747faEFD68D283eA44099D03",      
      wrappedContract: "0xbf8ddb613865e9d68931cacb34ff9ed2b03de1ff",
      usdcAddress: "0xcdf79194c6c285077a58da47641d4dbe51f63542",
      symbol: "iotx",
      dex: [{}],
      veldromeRouter: "",
      veldromeFactory:"",
      UniswapV3: [{name: "Uniswap",quoterV2:"0x8089D3A65163bcec536C9ABE3e6Cec3f1E5Cb6e3", router:"0xA6EB3902ca74265B7E5a1F66D39Fa0ceC0cA38Ff", factory: "0xF36788bF206f75F29f99Aa9d418fD8164b3B8198"},
      ],
      UniswapV2: [{name: "Uniswap",factory:"0xda257cBe968202Dea212bBB65aB49f174Da58b9D", router:"0x147CdAe2BF7e809b9789aD0765899c06B361C5cE"},
      ],
      liquidityTokens: 
      [{
        name: "WETH",
        address: "0xa00744882684c3e4747faefd68d283ea44099d03",
        stable: false
  
      },
     ],
      factoryAddresses: [{
        name: "UNISWAP",
        address: "0xeB640293F822a72E5f6359f305D4B6A107A868fa",
  
      },
      {
        name: "SUSHISWAP",
        address: "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac",
  
      },
      {
        name: "PANCAKESWAP",
        address: "0x1097053Fd2ea711dad45caCcc45EfF7548fCB362",
  
      }],
      
    },
    Ethereum: {
      chainName: "Ethereum",
  
      chainId: 1,
      factory: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
      router: "0x8D03Dc659Ddf00afDCeF8f898b146B3A5c06B384",
      nativeToken: {
        chainId:1,
        contractAddress: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        name: "Etherum", // Update based on the chain (e.g., "Ethereum", "Polygon")
        symbol: "ETH", // Use correct symbol for the network (e.g., ETH, MATIC, BNB)
        decimals: 18,
        image:  require("@/assets/tokenImages/eth.png"), // Replace with a proper image
      },       
       MarketplaceContract: "0xAeBe1C1C76c2EfF50535D5D8699709E36D5B0AB9",
       wrappedToken: "WETH",
      wrappedAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",      
      wrappedContract: "0x99B36F28dCAdcc43bb27225bf3515BeE64ECB8a2",
      usdcAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      symbol: "eth",
      dex: [{}],
      veldromeRouter: "",
      veldromeFactory:"",
      UniswapV3: [{name: "Uniswap",quoterV2:"0x61fFE014bA17989E743c5F6cB21bF9697530B21e", router:"0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", factory: "0x1F98431c8aD98523631AE4a59f267346ea31F984"},
      ],
      UniswapV2: [{name: "Uniswap",factory:"0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f", router:"0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"},
      ],
      liquidityTokens: 
      [
        {
          name: "WETH",
          address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
          stable: true
  
        },
      {
        name: "USDT",
        address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
        stable: true
  
      },
      {
        name: "USDC",
        address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        stable: true
  
      },
      ],
      factoryAddresses: [{
        name: "UNISWAP",
        address: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
  
      },
      {
        name: "SUSHISWAP",
        address: "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac",
  
      },
      {
        name: "PANCAKESWAP",
        address: "0x1097053Fd2ea711dad45caCcc45EfF7548fCB362",
  
      }],
      
    },
    BNBChain: {
      chainName: "Binance",
      chainId: 56,
      factory: "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73",
      router: "0xa81f6d554288e809d6f0e527a796fbd48c7399f3",
      nativeToken: {
        chainId: 56,
        contractAddress: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        name: "binance", // Update based on the chain (e.g., "Ethereum", "Polygon")
        symbol: "BNB", // Use correct symbol for the network (e.g., ETH, MATIC, BNB)
        decimals: 18,
        image:  require("@/assets/tokenImages/eth.png"), // Replace with a proper image
      },       
       MarketplaceContract: "0x31f4a90ccf568837802678e4194A16fA3A03676D",
      wrappedToken: "WBNB",
      wrappedAddress: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
      wrappedContract: "0x5abb0d79e2ad251f058dc59fc46e0b30ba986abd",
      usdcAddress: "0x55d398326f99059ff775485246999027b3197955",
      symbol: "bsc",
      veldromeRouter: "",
      veldromeFactory:"",
      UniswapV3: [{name: "Uniswap",quoterV2:"0x78D78E420Da98ad378D7799bE8f4AF69033EB077", router:"0xB971eF87ede563556b2ED4b1C0b0019111Dd85d2", factory: "0xdB1d10011AD0Ff90774D0C6Bb92e5C5c8b4461F7"},
        {name: "Pancageswap",quoterV2:"0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997", router:"0x13f4EA83D0bd40E75C8222255bc855a974568Dd4", factory: "0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865"}],
                 
        UniswapV2: [    {name: "Pancageswap",factory:"0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73", router:"0x10ED43C718714eb63d5aA57B78B54704E256024E"},
          {name: "Uniswap",factory:"0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6", router:"0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24"}
      ],
      dex: [{}],
      liquidityTokens: 
      [{
        name: "WETH",
        address: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
        stable: false
  
      },
      {
        name: "USDT",
        address: "0x55d398326f99059ff775485246999027b3197955",
        stable: true
  
      },
      {
        name: "USDC",
        address: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
        stable: true
  
      },],
      factoryAddresses: [{
        name: "BakerySwap",
        address: "0x01bF7C66c6BD861915CdaaE475042d3c4BaE16A7",
  
      },
      {
        name: "BISWAP",
        address: "0x858E3312ed3A876947EA49d572A7C42DE08af7EE ",
  
      },
      {
        name: "PANCAKESWAP",
        address: "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73",
  
      },
      { 
        name: "Apeswap",
        address: "0x0841BD0B734E4F5853f0dD8d7Ea041c241fb0Da6",
      }],
      
    },
    Base: {
      chainName: "Base",
  
      chainId: 8453,
      factory: "0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6",
      router: "0x8D03Dc659Ddf00afDCeF8f898b146B3A5c06B384",
      nativeToken: {
        chainId:8453, 
        contractAddress: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        name: "Ethereum", // Update based on the chain (e.g., "Ethereum", "Polygon")
        symbol: "ETH", // Use correct symbol for the network (e.g., ETH, MATIC, BNB)
        decimals: 18,
        image:  require("@/assets/tokenImages/eth.png"), // Replace with a proper image
      },  
      MarketplaceContract: "0x80D43b530fa070f9cBAe1dE6Ad849DdF8338303A",
      wrappedToken: "WETH",
      wrappedAddress: "0x4200000000000000000000000000000000000006",
      wrappedContract: "0x83e69da46c847d5e7de27184658e2724fdecc1fe",  
      usdcAddress: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
      symbol: "base",
      dex: [{}],
      veldromeRouter: "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43",
      veldromeFactory:"0x420DD381b31aEf6683db6B902084cB0FFECe40Da",
      UniswapV3: [{name: "Uniswap",quoterV2:"0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a", router:"0x2626664c2603336E57B271c5C0b26F421741e481", factory: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD"},
        {name: "Pancageswap",quoterV2:"0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997", router:"0x13f4EA83D0bd40E75C8222255bc855a974568Dd4", factory: "0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865"}
      ],
      UniswapV2: [{name: "Uniswap",factory:"0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6", router:"0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24"},
      ],
     
  
      liquidityTokens: 
      [{
        name: "WETH",
        address:"0x4200000000000000000000000000000000000006",
  
        stable: false
  
      },
      {
        name: "DAI",
        address: "0x50c5725949a6f0c72e6c4a641f24049a917db0cb",
        stable: true
  
      },
      {
        name: "USDC",
        address: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
        stable: true
  
      },{
        name: "USDCBC",
        address: "0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca",
        stable: true
  
      },],
      factoryAddresses: [{
        name: "baseSwap",
        address: "0xFDa619b6d20975be80A10332cD39b9a4b0FAa8BB",
  
      },
      {
        name: "UNISWAP",
        address: "0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6",
  
      },
      {
        name: "PANCAKESWAP",
        address: "0x8cFe327CEc66d1C090Dd72bd0FF11d690C33a2Eb",
  
      }
     ],
  
    },
    
    Polygon: {
      chainName: "Polygon",
      chainId: 137,
      factory: "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32",
      router: "0x8d03dc659ddf00afdcef8f898b146b3a5c06b384",
      nativeToken: {
        chainId: 137,
        contractAddress: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        name: "Polygon", // Update based on the chain (e.g., "Ethereum", "Polygon")
        symbol: "POL", // Use correct symbol for the network (e.g., ETH, MATIC, BNB)
        decimals: 18,
        image:  require("@/assets/tokenImages/matic.png"), // Replace with a proper image
      },  
      wrappedToken: "WMATIC",
      MarketplaceContract: "0x75C375E7a7615FB9829916D3D5780cc614364cb1",
      wrappedAddress: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
      wrappedContract: "0x94e2E38c9c096dF183674fA32253606EA4248e73",
      usdcAddress: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
      symbol: "polygon_pos",
      veldromeRouter: "",
      veldromeFactory:"",
      UniswapV3: [{name: "Uniswap",quoterV2:"0x61fFE014bA17989E743c5F6cB21bF9697530B21e", router:"0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", factory: "0x1F98431c8aD98523631AE4a59f267346ea31F984"},
        {name: "Qickswap",quoterV1:"0xa15F0D7377B2A0C0c10db057f641beD21028FC89", routerV1:"0xf5b509bB0909a69B1c207E495f687a596C168E12", factory: "0x411b0fAcC3489691f28ad58c47006AF5E3Ab3A28"}
      ],
      UniswapV2: [{name: "Uniswap",factory:"0x9e5A52f57b3038F1B8EeE45F28b3C1967e22799C", router:"0xedf6066a2b290C185783862C7F4776A2C8077AD1"},
        {name: "Quickswap", factory:"0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32", router:"0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff"}
      ],
     
      
      dex: [{}],
      liquidityTokens: 
      [{
        name: "WPOL",
        address:"0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
  
        stable: false
  
      },
      {
        name: "USDT",
        address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
        stable: true
  
      },
      {
        name: "USDC",
        address: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
        stable: true
  
      },
      {
        name: "WETH",
        address: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
        stable: true
  
      },
      {
        name: "WBTC",
        address: "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6",
        stable: true
  
      },],
      factoryAddresses: [{
        name: "Quickswap",
        address: "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32",
  
      },
      {
        name: "UNISWAP",
        address: "0x9e5A52f57b3038F1B8EeE45F28b3C1967e22799C",
  
      },
      
     ],
  
    },
    Optimism: {
      chainName: "Optimism",
  
      chainId: 10,
      factory: "0xF1046053aa5682b4F9a81b5481394DA16BE5FF5a",
      router: "0x8d03dc659ddf00afdcef8f898b146b3a5c06b384",
      nativeToken: {
        chainId: 10,
        contractAddress: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        name: "Ethereum", // Update based on the chain (e.g., "Ethereum", "Polygon")
        symbol: "ETH", // Use correct symbol for the network (e.g., ETH, MATIC, BNB)
        decimals: 18,
        image:  require("@/assets/tokenImages/eth.png"), // Replace with a proper image
      },  
      MarketplaceContract: "0x4119e8F0E198630fFa0fe55D00638Ef32124207a",
  
      wrappedToken: "WETH",
      wrappedAddress: "0x4200000000000000000000000000000000000006",
      wrappedContract: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      usdcAddress: "0x0b2c639c533813f4aa9d7837caf62653d097ff85",
      symbol:"optimism",
      dex: [{}],
      veldromeRouter: "0xa062aE8A9c5e11aaA026fc2670B0D65cCc8B2858",
      veldromeFactory:"0xF1046053aa5682b4F9a81b5481394DA16BE5FF5a",
      UniswapV3: [{name: "Uniswap",quoterV2:"0x61fFE014bA17989E743c5F6cB21bF9697530B21e", router:"0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", factory: "0x1F98431c8aD98523631AE4a59f267346ea31F984"},
      ],
      UniswapV2: [{name: "Uniswap",factory:"0x9e5A52f57b3038F1B8EeE45F28b3C1967e22799C", router:"0xedf6066a2b290C185783862C7F4776A2C8077AD1"},
      ],
      
      liquidityTokens: 
      [
        {
          name: "WOP",
          address: "0x4200000000000000000000000000000000000042",
          stable: false,
        },
        {
          name: "WETH",
          address: "0x4200000000000000000000000000000000000006",
          stable: false,
        },
        {
          name: "USDC",
          address: "0x7f5c764cbc14f9669b88837ca1490cca17c31607",
          stable: true,
        },
        {
          name: "USDCB",
          address: "0x0b2c639c533813f4aa9d7837caf62653d097ff85",
          stable: true,
        },
        {
          name: "ALLUSD",
          address: "0xcb8fa9a76b8e203d8c3797bf438d8fb81ea3326a",
          stable: true,
        },
        {
          name: "WSTETH",
          address: "0x1f32b1c2345538c0c6f582fcb022739c4a194ebb",
          stable: false,
        },
        {
          name: "VELO",
          address: "0x9560e827af36c94d2ac33a39bce1fe78631088db",
          stable: false,
        },
        {
          name: "SUSD",
          address: "0x8c6f28f2f1a3c87f0f938b96d27520d9751ec8d9",
          stable: true,
        },
        {
          name: "LUSD",
          address: "0xc40f949f8a4e094d1b49a23ea9241d289b7b2819",
          stable: true,
        },
        {
          name: "HAI",
          address: "0x10398abc267496e49106b07dd6be13364d10dc71",
          stable: false,
        },
      ],
      factoryAddresses: [{
        name: "Quickswap",
        address: "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32",
  
      },
      {
        name: "UNISWAP",
        address: "0x0c3c1c532F1e39EdF36BE9Fe0bE1410313E074Bf",
  
      },
     ],
    },
    Arbitrum: {
      chainName: "Arbitrum",
      chainId: 42161,
      factory: "0xf1D7CC64Fb4452F05c498126312eBE29f30Fbcf9",
      router: "0x8D03Dc659Ddf00afDCeF8f898b146B3A5c06B384",
      nativeToken: {
        contractAddress: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        name: "Ethereum", // Update based on the chain (e.g., "Ethereum", "Polygon")
        symbol: "ETH", // Use correct symbol for the network (e.g., ETH, MATIC, BNB)
        decimals: 18,
       chainId: 42161,
        image:  require("@/assets/tokenImages/eth.png"), // Replace with a proper image
      },
      MarketplaceContract: "0x5426B18D5196C1847866aE6B19D165286396fb87",
      wrappedToken: "WETH",
      wrappedAddress: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
      wrappedContract: "0x83e69da46c847d5e7de27184658e2724fdecc1fe",
      usdcAddress: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
      symbol: "arbitrum",
      dex: [{}],
      liquidityTokens: 
      [
        {
          name: "Arb",
          address: "0x912ce59144191c1204e64559fe8253a0e49e6548",
          stable: false,
        },
        {
          name: "WETH",
          address: "0x83e69da46c847d5e7de27184658e2724fdecc1fe",
          stable: false,
        },
        {
          name: "USDC",
          address: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
          stable: true,
        },
        
        {
          name: "WSTETH",
          address: "0x5979d7b546e38e414f7e9822514be443a4800529",
          stable: false,
        },
        {
          name: "USDT",
          address: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
          stable: false,
        },
      ],
      veldromeRouter: "",
      veldromeFactory:"",
      UniswapV3: [{name: "Uniswap",quoterV2:"0x61fFE014bA17989E743c5F6cB21bF9697530B21e", router:"0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", factory: "0x1F98431c8aD98523631AE4a59f267346ea31F984"},
      ],
      UniswapV2: [{name: "Uniswap",factory:"0xf1D7CC64Fb4452F05c498126312eBE29f30Fbcf9", router:"0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24"},
      ],
      factoryAddresses: [
      {
        name: "Pancake",
        address: "0x8cFe327CEc66d1C090Dd72bd0FF11d690C33a2Eb",
  
      },
      {
        name: "UNISWAP",
        address: "0xf1D7CC64Fb4452F05c498126312eBE29f30Fbcf9",
  
      },
     ],
    },
  };
  
  