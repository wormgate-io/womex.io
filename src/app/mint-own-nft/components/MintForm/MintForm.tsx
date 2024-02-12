'use client';

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";

import Button from "../../../../components/ui/Button/Button";
import FormControl from "../../../../components/ui/FormControl/FormControl";
import UploadInput from "../../../../components/ui/UploadInput/UploadInput";
import Input from "../../../../components/ui/Input/Input";
import { generateNftName, generateNftDescription } from "../../../../utils/generators";
import ApiService from "../../../../services/ApiService";

import styles from './MintForm.module.css';

export interface MintFormData {
    file: string;
    name: string;
    description: string;
}

export interface MintSubmitEvent extends Omit<MintFormData, 'file'> {
    image: File;
}

interface MintFormProps {
    onSubmit: (data: MintSubmitEvent, key?: string) => void;
}

export default function MintForm({ onSubmit }: MintFormProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [fileKey, setFileKey] = useState<string>('');

    const {
        control,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<MintFormData>({
        defaultValues: {
            file: '',
            name: '',
            description: '',
        },
    });

    const submit = (data: MintFormData) => {
        onSubmit({
            ...data,
            image: file!
        }, fileKey);
    };

    const handleUpload = (file: File) => {
        setFile(file);
        setFileKey('');
    };

    const setAutoGeneratedNameValue = () => {
        setValue('name', generateNftName());
    };

    const setAutoGeneratedDescriptionValue = () => {
        setValue('description', generateNftDescription());
    };

    const setAutoGeneratedFile = async () => {
        try {
            setIsGenerating(true);
            const randomImage = await ApiService.getRandomImage();
            const values = Object.values(randomImage.blob);
            const u8Arr = new Uint8Array(values.length);
            values.forEach((value, i) => {
                u8Arr[i] = value;
            });
            const filename = randomImage.key.split('/').slice(-1)[0];
            const file = new File([u8Arr], filename, { type: randomImage.type });
            setFile(file);
            setFileKey(randomImage.key);
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit(submit)}>
                <FormControl
                    title="Upload NFT Image"
                    error={errors.file?.type === "required" ? 'Required field' : ''}
                >
                    <Controller
                        name="file"
                        control={control}
                        rules={{ required: !fileKey }}
                        render={({ field }) => (
                            <UploadInput
                                {...field}
                                file={file}
                                onUpload={handleUpload}
                                accept=".png, .jpeg, .jpg, .gif, .svg, .webm"
                            />
                        )}
                    />
                </FormControl>

                <FormControl
                    title="Asset Name"
                    error={errors.name?.type === "required" ? 'Required field' : ''}
                >
                    <Controller
                        name="name"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <Input {...field} type="text" placeholder="e.g. “Super Puper Ryan Gosling”" />
                        )}
                    />
                </FormControl>

                <Button type="submit" block>Mint</Button>
            </form>
        </>
    )
}