import React from 'react'
import { configure, addDecorator } from '@storybook/react'
import { ThemeProvider } from 'styled-components'

import 'styles/global'
import theme from 'styles/theme'

const req = require.context('../src', true, /.stories.js$/)
function loadStories() {
  req.keys().forEach(filename => req(filename))
}

addDecorator(story => (
  <ThemeProvider theme={theme}>
    <div style={{ padding: 20 }}>{story()}</div>
  </ThemeProvider>
))

configure(loadStories, module)
