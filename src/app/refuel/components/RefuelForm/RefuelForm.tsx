'use client';

import { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { Divider, Flex, Form, Input } from "antd";
import { useNetwork } from "wagmi";
import Image from "next/image";
import cn from './RefuelForm.module.scss';

import Button from "../../../../components/ui/Button/Button";
import styles from "../../../bridge/components/NftModal/NftModal.module.css";
import ChainSelect from "../../../../components/ChainSelect/ChainSelect";
import ChainStore from "../../../../store/ChainStore";

function RefuelForm() {
    const [form] = Form.useForm();
    const { chain } = useNetwork();
    const { chains } = ChainStore;

    const selectedChain = useMemo(() => {
        if (chain && chains.length) {
            return chains.find(c => c.network === chain.network)
        }

        return null;
    }, [chains, chain]);

    useEffect(() => {
        if (selectedChain && chains.length) {
            form.setFieldsValue({
                from: selectedChain?.id,
                to: chains[0]?.id
            });
        }
    }, [chains, selectedChain]);

    const onSubmit = (formData: any) => {
        console.log(formData);
    };

    return (
        <Form size="large" layout="vertical" form={form} onFinish={onSubmit}>
            <Flex align="center" gap={12}>
                <Form.Item style={{ flex: 1 }} name="from" label="From">
                    <ChainSelect
                        chains={chains}
                        className={styles.dropdown}
                    />
                </Form.Item>
                <Image src="/svg/arrows-left-right.svg" alt="" width={20} height={20} />
                <Form.Item style={{ flex: 1 }} name="to" label="To">
                    <ChainSelect
                        chains={chains}
                        className={styles.dropdown}
                    />
                </Form.Item>
            </Flex>

            <Form.Item name="amount" className={cn.amount} label={
                <Flex align="center" justify="space-between">
                    <div>Refuel Amount</div>
                    <div>Balance: 0 <span>Max</span></div>
                </Flex>
            }>
                <Input placeholder={`0 ${selectedChain?.name || 'ETH'}`} />
                <div>Max Refuel: 0</div>
            </Form.Item>

            <Divider />

            <div className={cn.refuelInfo}>
                <Flex className={cn.refuelInfoItem} justify="space-between" align="center" wrap="wrap">
                    <div className={cn.refuelInfoName}>Estimated Transfer Time</div>
                    <div className={cn.refuelInfoPrice}>~3min</div>
                </Flex>
                <Flex className={cn.refuelInfoItem} justify="space-between" align="center" wrap="wrap">
                    <div className={cn.refuelInfoName}>Refuel Fee</div>
                    <div className={cn.refuelInfoPrice}>-- ETH</div>
                </Flex>
                <Flex className={cn.refuelInfoItem} justify="space-between" align="center" wrap="wrap">
                    <div className={cn.refuelInfoName}>LayerZero Fee</div>
                    <div className={cn.refuelInfoPrice}>-- ETH</div>
                </Flex>
                <Flex className={cn.refuelInfoItem} justify="space-between" align="center" wrap="wrap">
                    <div className={cn.refuelInfoName}>Expected Output</div>
                    <div className={cn.refuelInfoPrice}>-- ETH</div>
                </Flex>
            </div>

            <Flex>
                <Button block>Refuel</Button>
            </Flex>
        </Form>
    )
}

export default observer(RefuelForm);