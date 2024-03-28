import { Dropdown, Flex, MenuProps, message } from 'antd';
import Image from 'next/image';
import { useEffect, useMemo } from 'react';
import clsx from 'clsx';
import { Chain, useNetwork, useSwitchNetwork } from 'wagmi';
import { getChainLogo } from '../../utils/getChainLogo';

import styles from './NetworkChainSelect.module.css';
import ChainStore from '../../store/ChainStore';
import { observer } from 'mobx-react-lite';
import { toDictionary } from '../../utils/to-dictionary';
import { useGetChains } from '../../hooks/use-get-chains';
import { useSearchParams } from 'next/navigation';
import { HYPERLANE_QUERY_PARAM_NAME } from '@utils/hyperlaneQueryParamName';

const WRONG_NETWORK = 'Wrong Network'

interface NetworkChainSelectProps {
  className?: string;
}

function NetworkChainSelect({ className }: NetworkChainSelectProps) {
  const searchParams = useSearchParams()
  const [messageApi, contextHolder] = message.useMessage();
  const { chain, chains: allChains } = useNetwork();
  const { chains: availableChains } = ChainStore;
  const { reset, switchNetwork, error } = useSwitchNetwork({
    onSettled: () => {
      reset();
    },
  });
  const getChains = useGetChains()

  useEffect(() => {
    getChains()
  }, [searchParams.get(HYPERLANE_QUERY_PARAM_NAME)])

  const chains = useMemo(() => {
    const chainsById = toDictionary(allChains, x => x.id);

    return availableChains.reduce((chains: Chain[], { chainId }) => {
      const chain = chainsById[chainId]

      if (chain) {
        chains.push(chain)
      }

      return chains;
    }, [])
  }, [allChains, availableChains])

  const chainName = useMemo(() => {
    if (chain && chains.some(({ network }) => network === chain.network)) {
      return chain.name;
    }
    return WRONG_NETWORK;
  }, [chain, chains]);

  const chainsMenu = useMemo(() => {
    const items: MenuProps['items'] = [...chains]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => ({
        key: c.id,
        label: c.name,
        icon: <Image width={24} height={24} src={getChainLogo(c.network)} alt="" />,
      }));

    return items;
  }, [chains]);

  const chainLogo = useMemo(() => chainName === WRONG_NETWORK ? '' : getChainLogo(chain?.network!), [chain, chainName]);

  const handleSwitchNetwork = (chainId: number) => {
    if (switchNetwork) {
      switchNetwork(chainId);
    }
  };

  useEffect(() => {
    if (error) {
      void messageApi.warning('User rejected the request');
    }
  }, [error, messageApi]);

  if (!chain || !switchNetwork) {
    return null;
  }

  const isKnownChain = chainName !== WRONG_NETWORK

  return (
    <>
      {contextHolder}

      <Dropdown
        trigger={['click']}
        menu={{
          items: chainsMenu,
          selectable: true,
          defaultSelectedKeys: [String(chain.id)],
          onClick: ({ key }) => handleSwitchNetwork(parseInt(key)),
        }}
        rootClassName={styles.dropdown}
      >
        <Flex
          align="center"
          gap={8}
          className={clsx('network-chain-select', styles.dropdownBtn, !isKnownChain && styles.wrong, className)}
        >
          {chainLogo && <Image src={chainLogo} width={24} height={24} alt="" />}

          <div className={clsx(styles.value, 'network-chain-select__name')}>{chainName}</div>

          <Image src="/svg/ui/dropdown-arrow.svg" width={24} height={24} alt="" />
        </Flex>
      </Dropdown>
    </>
  );
}

export default observer(NetworkChainSelect)