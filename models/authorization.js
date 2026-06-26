function can(user, feature) {
  if(user.features.includes(feature)){
    return true
  }

  return false
}


const authorization = {
  can
}

export default authorization;