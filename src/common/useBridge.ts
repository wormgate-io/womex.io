import { useEffect, useState } from "react";
import { useAccount, useNetwork, useSwitchNetwork } from "wagmi";
import { notification } from "antd";
import { NFTDto } from "./dto/NFTDto";
import { EstimationBridgeType, bridgeNFT, estimateBridge } from "../core/contractController";
import { ChainDto } from "./dto/ChainDto";
import ChainStore from "../store/ChainStore";
import AppStore from "../store/AppStore";
import { getContractAddress , DEFAULT_REFUEL_COST_USD, UnailableNetworks } from "./constants";
import { NetworkName } from "./enums/NetworkName";
import ApiService from "../services/ApiService";
import { getBridgeBlockExplorer } from "@utils/getBridgeBlockExplorer";
import { BridgeType } from "./enums/BridgeType";

interface SubmittedData {
    previousChain: ChainDto;
    nextChain: ChainDto;
    transactionLink: string | null
}

export function useBridge(nft: NFTDto, onAfterBridge?: (previousChain?: ChainDto, nextChain?: ChainDto) => void, useFirstChainToBridge = false) {
    const [selectedChain, setSelectedChain] = useState<string>();
    const [refuelCost, setRefuelCost] = useState(DEFAULT_REFUEL_COST_USD);
    const [refuelEnabled, setRefuelEnable] = useState<boolean>(false);
    const [_chains, setChains] = useState<ChainDto[]>([]);
    const [isPending , setIsPending] = useState<boolean>(false);
    const [submittedData, setSubmittedData] = useState<SubmittedData | null>(null);
    const [bridgePriceList, setBridgePriceList] = useState<EstimationBridgeType>([]);
    const { chains } = ChainStore;
    const { account } = AppStore;

    const { chain: currentChain } = useNetwork();
    const { switchNetworkAsync } = useSwitchNetwork();
    const { address } = useAccount();

    const isNeedChangeChain = nft.chainNativeId !== currentChain?.id;

    const switchNetwork = async () => {
        await switchNetworkAsync?.(nft?.chainNativeId);
    };

    const estimateBridgeFee = async (selectedChain: string) => {
        if (nft) {
            const nftChain = ChainStore.chains.find(c => c.chainId === nft.chainNativeId);
            const chain = ChainStore.chains.find(c => c.id === selectedChain);

            if (chain) {
                let _currentNetwork: string = currentChain?.network!;

                const priceList = await estimateBridge(_chains, nftChain?.token!, {
                    contractAddress: getContractAddress(nft.bridgeType, _currentNetwork as NetworkName),
                    chainToSend: {
                        id: chain.chainId,
                        name: chain.name,
                        network: chain.network,
                        lzChain: chain.lzChain,
                        hyperlaneChain: chain.hyperlaneChain,
                        token: chain.token
                    },
                    bridgeType: nft.bridgeType,
                    account,
                    accountAddress: address!
                }, nft?.tokenId, refuelEnabled, refuelCost);

                setBridgePriceList(priceList);
            }
        }
    };

    const onBridge = async () => {
        try {
            setIsPending(true);

            const chainToSend = ChainStore.getChainById(selectedChain!);
            let _currentNetwork: string = currentChain?.network!;
            const isHyperlaneBridgeType = nft.bridgeType === BridgeType.Hyperlane

            if (currentChain?.network !== nft.chainNetwork) {
                const res = await switchNetworkAsync?.(nft.chainNativeId);
                if (res) {
                    _currentNetwork = res.network;
                }
            }

            if (!chainToSend) {
                notification.error({ message: 'Something went wrong :(' });
                return;
            }

            const result = await bridgeNFT({
                contractAddress: getContractAddress(nft.bridgeType, _currentNetwork as NetworkName),
                bridgeType: nft.bridgeType,
                chainToSend: {
                    id: chainToSend.chainId,
                    name: chainToSend.name,
                    network: chainToSend.network,
                    lzChain: chainToSend.lzChain,
                    hyperlaneChain: chainToSend.hyperlaneChain,
                    token: chainToSend.token
                },
                account,
                accountAddress: address!
            }, nft.tokenId, refuelEnabled, refuelCost);

            if (result.result) {
                notification.success({
                    message: result.message
                });

                await ApiService.bridgeNFT({
                    transactionHash: result.transactionHash,
                    previousChainNetwork: nft?.chainNetwork!,
                    nextChainNetwork: chainToSend?.network!,
                    nftId: nft.id
                });

                const transactionInfo = isHyperlaneBridgeType ? await ApiService.getHyperlaneTransactionInfo(result.transactionHash) : null;

                const previousChain = ChainStore.getChainById(nft.chainId)!;
                const nextChain = ChainStore.getChainById(chainToSend?.id!)!;

                setSubmittedData({
                    previousChain,
                    nextChain,
                    transactionLink: transactionInfo ? getBridgeBlockExplorer(nft.bridgeType, transactionInfo.id) : null
                });

                onAfterBridge?.(previousChain, nextChain);
            } else {
                notification.warning({
                    message: result.message
                });
            }
        } catch (e) {
            console.error(e);
            notification.error({ message: 'Something went wrong :(' });
        } finally {
            setIsPending(false);
        }
    };

    useEffect(() => {
        if (chains.length && nft) {
            const _chains = chains
                .filter(x => x.id !== nft.chainId && x.availableBridgeTypes.includes(nft.bridgeType))
                .filter(x => !UnailableNetworks[x.network as NetworkName]?.includes(nft.chainNetwork as NetworkName))

            setChains(_chains);

            let initialBridgeChain = _chains[0].id;

            if (useFirstChainToBridge) {
                initialBridgeChain = ChainStore.getChainById(nft.chainIdToFirstBridge)?.id || _chains[0].id;
            }

            setSelectedChain(initialBridgeChain);
        }
    }, [chains, nft]);

    useEffect(() => {
        if (selectedChain && nft.chainNativeId === currentChain?.id) {
            estimateBridgeFee(selectedChain);
        }
    }, [selectedChain, refuelEnabled, refuelCost, _chains, currentChain, nft]);

    return {
        chains: _chains,
        refuelCost,
        refuelEnabled,
        selectedChain,
        isPending,
        submittedData,
        bridgePriceList,
        isNeedChangeChain,
        switchNetwork,
        onChangeChain: setSelectedChain,
        onChangeRefuelEnabled: setRefuelEnable,
        onChangeRefuelGas: setRefuelCost,
        onBridge,
    };
}