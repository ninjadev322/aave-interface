import { MainLayout } from 'src/layouts/MainLayout';
import { ethers } from 'ethers';
import { useState, useEffect } from 'react';
import { useWeb3Context } from 'src/libs/hooks/useWeb3Context';
import {
  // Box,
  // ToggleButton,
  // ToggleButtonGroup,
  // Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { ListItemLoader } from '../src/modules/dashboard/lists/ListItemLoader';

export default function Historys() {
  const { breakpoints } = useTheme();
  const lg = useMediaQuery(breakpoints.up('lg'));

  const { currentAccount } = useWeb3Context();
  const [supplyEvents, SetSupplyEvents] = useState([]);
  const [withdrawEvents, SetWithdrawEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentAccount) getUserTransactionHistory();
  }, [currentAccount]);

  //TestnetMintableERC20-Aave of every token
  const tokenMap = new Map([
    ['0xd74047010D77c5901df5b0f9ca518aED56C85e8D', 'ETH'],
    ['0x4aAded56bd7c69861E8654719195fCA9C670EB45', 'DAI'],
    ['0x237f409fBD10E30e237d63d9050Ae302e339028E', 'LINK'],
    ['0xb18d016cDD2d9439A19f15633005A6b2cd6Aa774', 'USDC'],
    ['0x124F70a8a3246F177b0067F435f5691Ee4e467DD', 'WBTC'],
    ['0x326005cFdF58bfB38650396836BEBF815F5ab4dD', 'USDT'],
    ['0x100aB78E5A565a94f2a191714A7a1B727268eFFb', 'AAVE'],
    ['0x7eEB186F13538e6795a0823e2D7283FEeD2738f5', 'EURS'],
  ]);

  //decimals of every token
  const decimals = new Map([
    ['0xd74047010D77c5901df5b0f9ca518aED56C85e8D', 18],
    ['0x4aAded56bd7c69861E8654719195fCA9C670EB45', 18],
    ['0x237f409fBD10E30e237d63d9050Ae302e339028E', 18],
    ['0xb18d016cDD2d9439A19f15633005A6b2cd6Aa774', 6],
    ['0x124F70a8a3246F177b0067F435f5691Ee4e467DD', 8],
    ['0x326005cFdF58bfB38650396836BEBF815F5ab4dD', 6],
    ['0x100aB78E5A565a94f2a191714A7a1B727268eFFb', 18],
    ['0x7eEB186F13538e6795a0823e2D7283FEeD2738f5', 2],
  ]);

  const SupplyLogicAbi = [
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'address', name: 'reserve', type: 'address' },
        { indexed: true, internalType: 'address', name: 'user', type: 'address' },
      ],
      name: 'ReserveUsedAsCollateralDisabled',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'address', name: 'reserve', type: 'address' },
        { indexed: true, internalType: 'address', name: 'user', type: 'address' },
      ],
      name: 'ReserveUsedAsCollateralEnabled',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'address', name: 'reserve', type: 'address' },
        { indexed: false, internalType: 'address', name: 'user', type: 'address' },
        { indexed: true, internalType: 'address', name: 'onBehalfOf', type: 'address' },
        { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
        { indexed: true, internalType: 'uint16', name: 'referralCode', type: 'uint16' },
      ],
      name: 'Supply',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'address', name: 'reserve', type: 'address' },
        { indexed: true, internalType: 'address', name: 'user', type: 'address' },
        { indexed: true, internalType: 'address', name: 'to', type: 'address' },
        { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      ],
      name: 'Withdraw',
      type: 'event',
    },
  ];

  async function getUserTransactionHistory() {
    const provider = new ethers.providers.JsonRpcProvider(
      'https://rinkeby.infura.io/v3/138e3c68c5e3478ca8a6e2e118670591'
    );

    const supplyLogic = new ethers.Contract(
      '0xE039BdF1d874d27338e09B55CB09879Dedca52D8', //Pool-Proxy-Aave contract address deployed on rinkeby testnet
      SupplyLogicAbi, //Supply and Withdraw events exist in SupplyLogic
      provider
    );

    const supplyFilter = supplyLogic.filters.Supply(
      null, //address indexed reserve,
      null, // address user, user is not indexed variable so we can't add address to filter
      null, //address indexed onBehalfOf,
      null, //uint256 amount,
      null //uint16 indexed referralCode
    );

    const withdrawFilter = supplyLogic.filters.Withdraw(
      null, //address indexed reserve,
      currentAccount, // address indexed user,
      null, //address indexed to,
      null //uint256 amount
    );

    const startBlock = 10340643; //contract deployed block number
    const endBlock = await provider.getBlockNumber(); //current blocknumber
    let allSupplyEvents: unknown[] | ((prevState: never[]) => never[]) = [];
    let allWithdrawEvents: unknown[] | ((prevState: never[]) => never[]) = [];

    // maximum block range is 5000
    for (let i = endBlock; i >= startBlock && allSupplyEvents.length < 5; i -= 5000) {
      const _endBlock = i;
      const _startBlock = Math.max(startBlock, i - 4999);
      const events = await supplyLogic.queryFilter(supplyFilter, _startBlock, _endBlock);
      const filteredEvents = events.filter(
        (event) => event.args[2].toLowerCase() == currentAccount.toLowerCase()
      );
      allSupplyEvents = [...allSupplyEvents, ...filteredEvents];
      console.log('block status', i, allSupplyEvents.length);
    }
    allSupplyEvents.sort(function (a, b) {
      return a.blockNumber - b.blockNumber;
    });
    allSupplyEvents = allSupplyEvents.slice(-5);
    console.log('supply result', allSupplyEvents);
    SetSupplyEvents(allSupplyEvents);

    // maximum block range of queryFilter is 5000
    for (let i = endBlock; i >= startBlock && allWithdrawEvents.length < 5; i -= 5000) {
      const _endBlock = i;
      const _startBlock = Math.max(startBlock, i - 4999);
      const events = await supplyLogic.queryFilter(withdrawFilter, _startBlock, _endBlock);
      allWithdrawEvents = [...allWithdrawEvents, ...events];
      console.log('block status', i, allWithdrawEvents.length);
    }
    allWithdrawEvents.sort(function (a, b) {
      return a.blockNumber - b.blockNumber;
    });
    allWithdrawEvents = allWithdrawEvents.slice(-5);
    console.log('withdraw result', allWithdrawEvents);
    SetWithdrawEvents(allWithdrawEvents);

    setIsLoading(false);
  }

  return (
    <>
      Supply
      <ul>
        {isLoading ? (
          <ListItemLoader />
        ) : (
          supplyEvents.map((supplyEvent, i) => {
            return (
              <li key={i}>
                {tokenMap.get(supplyEvent.args[0])}{' '}
                {ethers.utils.formatUnits(
                  supplyEvent.args.amount,
                  decimals.get(supplyEvent.args[0])
                )}
              </li>
            );
          })
        )}
      </ul>
      Withdraw
      <ul>
        {isLoading ? (
          <ListItemLoader />
        ) : (
          withdrawEvents.map((withdrawEvent, i) => {
            return (
              <li key={i}>
                {tokenMap.get(withdrawEvent.args[0])}{' '}
                {ethers.utils.formatUnits(
                  withdrawEvent.args.amount,
                  decimals.get(withdrawEvent.args[0])
                )}
              </li>
            );
          })
        )}
      </ul>
    </>
  );
}

Historys.getLayout = function getLayout(page: React.ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};
