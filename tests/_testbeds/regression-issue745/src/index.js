/**
 * Taken from https://github.com/sresch4b/cyclonedx-issue/blob/961aed0b3a6577a4c76e3ab94420ed4e770497e7/src/index.js
 * Originally published under MIT license by GIthubUser "sresch4b".
 */

const { ApolloClient, InMemoryCache } = require('@apollo/client')

function component () {
  const client = new ApolloClient({
    uri: 'https://example.com/',
    cache: new InMemoryCache(),
  })
  client.query({ query: '' }).then(() => console.log('test'))
  const element = document.createElement('div')
  return element
}

document.body.appendChild(component())
