import { Flex, Spin } from "antd";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/navigation";

import PinataImage from "../../../../components/PinataImage";
import NftStore from "../../../../store/NftStore";
import ChainLabel from "../../../../components/ChainLabel/ChainLabel";
import { NFTDto } from "../../../../common/dto/NFTDto";
import ListCard from "../../../../components/ListCard/ListCard";

import styles from "./NftList.module.css";

function NftList() {
    const router = useRouter();
    const nfts = [...NftStore.nfts].sort((a, b) => a.chainName.localeCompare(b.chainName));

    const handleCardClick = (nft: NFTDto) => {
        router.push(`/nfts/${nft.id}`);
    };

    if (NftStore.loading) {
        return <Spin size="large" />
    }

    return (
        <Flex gap={24} wrap="wrap" className={styles.list}>
            {nfts.map((nft) => (
                <ListCard
                    key={nft.id}
                    label={
                        <ChainLabel
                            network={nft.chainNetwork}
                            label={nft.chainName}
                            className={styles.chain}
                            iconClassName={styles.chainIcon}
                            labelClassName={styles.chainLabel}
                        />
                    }
                    image={<PinataImage hash={nft.pinataImageHash} fileName={nft.pinataFileName} name={nft.name} />}
                    title={nft.name}
                    onClick={() => handleCardClick(nft)}
                    className={styles.listItem}
                    tokenId={nft.tokenId}
                />
            ))}
        </Flex>
    )
}

export default observer(NftList);