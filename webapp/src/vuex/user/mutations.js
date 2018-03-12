import * as types from './mutation-type'

const mutations = {
  [types.SET_ERROR_INFO] (state, data) {
    state.loginResult = data
  },
  [types.SET_PROJECT_INFO] (state, data) {
    state.project = data
  }
}

export default mutations
