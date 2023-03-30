import Head from 'next/head'
import Image from 'next/image'
import { Inter } from 'next/font/google'
import { Box, Button, Input, Text, Spinner} from "@chakra-ui/react";
import * as Generation from "@/generation/generation_pb";
import { GenerationServiceClient } from "./../generation/generation_pb_service";
import { grpc as GRPCWeb } from "@improbable-eng/grpc-web";
import { NodeHttpTransport } from "@improbable-eng/grpc-web-node-http-transport";
// import fs from "fs";
import {
    buildGenerationRequest,
    executeGenerationRequest,
    onGenerationComplete,
} from "../helpers";
import {ChangeEvent, useEffect, useState} from "react";

// This is a NodeJS-specific requirement - browsers implementations should omit this line.
GRPCWeb.setDefaultTransport(NodeHttpTransport());

// Authenticate using your API key, don't commit your key to a public repository!
const metadata = new GRPCWeb.Metadata();
metadata.set("Authorization", "Bearer " + process.env.NEXT_PUBLIC_API_KEY);

// Create a generation client to use with all future requests
const client = new GenerationServiceClient("https://grpc.stability.ai", {});

const inter = Inter({ subsets: ['latin'] })

export default function Home() {

    const [img, setImg] = useState('')
    const [value, setValue] = useState('')
    const [loading, setLoading] = useState(false)

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const target = event.target as HTMLButtonElement;
        if (target) setValue(target.value)

    }

    const request = buildGenerationRequest("stable-diffusion-512-v2-1", {
        type: "text-to-image",
        prompts: [
            {
                text: value,
            },
        ],
        width: 1024,
        height: 768,
        samples: 1,
        cfgScale: 13,
        steps: 40,
        sampler: Generation.DiffusionSampler.SAMPLER_K_DPMPP_2M,
    });


    const getNewImage = () => {
        console.log(`running`, value)
        setLoading(true)
        executeGenerationRequest(client, request, metadata)
            .then((res) => {
                // console.log('res', res)
                // @ts-ignore
                return res.imageArtifacts.forEach((artifact) => {
                    // console.log(`image-${artifact.getSeed()}.png`)
                    // console.log(artifact.getBinary_asB64())

                    setImg(artifact.getBinary_asB64())
                    setLoading(false)
                });
            })
            .catch((error) => {
                console.error("Failed to make text-to-image request:", error);
            });
    }

    const divStyle = {
        borderRadius: '12px',
        width: '480px',
        // height: '240px'
    };


  return (
    <>
      <Head>
        <title>AI Card Cover Generator</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
         <Box display={'flex'} flexDir={'column'} justifyContent={'center'} alignItems={'center'} p={'12px'}>
            <Text fontSize={'40px'} mb={'30px'}>AI Card Cover Generator</Text>
             <Text mb={'20px'}>Write your desired theme text and let the AI generate a card cover for you. Feel free to get creative.</Text>
             <Text mb={'20px'}>Examples: <b><i>Roses and ice cream</i></b> or <b><i>Dogs in space</i></b></Text>
             <Text mb={'20px'}>The AI should be able to read any description and generate a cover for it...</Text>
             <Input placeholder='Write theme prompt here' onChange={handleChange} width={'400px'} mb={'30px'} />
             <Button onClick={getNewImage} width={'400px'}  mb={'30px'}>{loading ? <Spinner speed='0.55s' /> : 'Generate Image'}</Button>


             {img !== '' ? <img src={`data:image/png;base64, ${img}`} style={divStyle}/> : null}

         </Box>
      </main>
    </>
  )
}
