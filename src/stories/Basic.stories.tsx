import React, { useState } from 'react'
import { Meta } from '@storybook/react/types-6-0'
import { Story } from '@storybook/react'
import {
  DrawROI,
  DrawROIProps,
  DrawPolygonControl,
  DrawRectControl,
} from '../DrawROI'
import { IMG1, IMG2 } from './drawroidata'

import Box from '@mui/material/Box'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import Select, { SelectChangeEvent } from '@mui/material/Select'

export default {
  title: 'Example/DrawROI',
  component: DrawROI,
} as Meta

// const imgUrl = 'https://placekitten.com/1080/720'
const regions0 = [
  [
    [0.38499485866325844, 0.12456036722424725],
    [0.5441730250014928, 0.12456036722424725],
    [0.5441730250014928, 0.3818726458195483],
    [0.38499485866325844, 0.3818726458195483],
  ],
  [
    [0.24127088323164886, 0.34941884491563646],
    [0.6693519713451527, 0.34941884491563646],
    [0.6693519713451527, 0.5742773226070257],
    [0.24127088323164886, 0.5742773226070257],
  ],
]

// Create a master template for mapping args to render the component
const Template: Story<DrawROIProps> = () => {
  const [roi, setROI] = useState<number[][][]>(regions0)
  const [imgId, setImgId] = useState<string>('1')

  const handleRegionsChange = (newVal) => {
    console.log(`🍑 ROI changes`)
    console.log(newVal)
    // setROI([...newVal])
  }

  const handleSelectImageChange = (evt: SelectChangeEvent) => {
    setImgId(evt.target.value)
  }

  let imgUrl = IMG1
  if (imgId === '2') {
    imgUrl = IMG2
  }

  return (
    <>
      <Box sx={{ minWidth: 200 }}>
        <FormControl fullWidth>
          <InputLabel id="imgselect">Select Image</InputLabel>
          <Select
            labelId="imgselect-label"
            id="imgselect"
            value={imgId}
            label="Image"
            onChange={handleSelectImageChange}
          >
            <MenuItem value={'1'}>kitty image</MenuItem>
            <MenuItem value={'2'}>kitty base64</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <div style={{ width: '1000px', height: '500px' }}>
        <DrawROI
          imgUrl={imgUrl}
          defaultROIs={roi}
          onROIsChange={handleRegionsChange}
        >
          {/* <DrawPolygonControl /> */}
          <DrawRectControl />
        </DrawROI>
      </div>
    </>
  )
}

// Reuse that template for creating different stories
export const DrawROIUsage = Template.bind({})
DrawROIUsage.args = {} as DrawROIProps

DrawROIUsage.storyName = 'Draw ROI'
