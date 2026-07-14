function can(user, feature, resource) {
  let authorized = false;

  if (user.features.includes(feature)) {
    authorized = true;
  }

  if (feature === "update:user" && resource) {
    authorized = false;

    if (user.id === resource.id || can(user, "update:user:others")) {
      authorized = true;
    }
  }

  return authorized;
}

function filterOutput(user, feature, resource) {
  if (feature === "read:user") {
    return {
      id: resource.id,
      username: resource.username,
      features: resource.features,
      created_at: resource.created_at,
      updated_at: resource.updated_at,
    };
  }

  if (feature === "read:user:self" && user.id === resource.id) {
    return {
      id: resource.id,
      username: resource.username,
      email: resource.email,
      features: resource.features,
      created_at: resource.created_at,
      updated_at: resource.updated_at,
    };
  }

  if (feature === "read:session" && user.id === resource.user_id) {
    return {
      id: resource.id,
      token: resource.token,
      user_id: resource.user_id,
      created_at: resource.created_at,
      updated_at: resource.updated_at,
      expires_at: resource.expires_at,
    };
  }

  if (
    feature === "read:activation_token" &&
    user.user_id === resource.user_id
  ) {
    return {
      id: resource.id,
      user_id: resource.user_id,
      used_at: resource.used_at,
      created_at: resource.created_at,
      updated_at: resource.updated_at,
      expires_at: resource.expires_at,
    };
  }

  if (feature === "read:migration" || feature === "create:migration") {
    return resource.map((migration) => {
      return {
        path: migration.path,
        name: migration.name,
        timestamp: migration.timestamp,
      };
    });
  }

  if (feature === "read:status") {
    const output = {
      updated_at: new Date().toISOString(),
      dependencies: {
        database: {
          max_connections: resource.maxConnections,
          open_connections: resource.openConnections,
        },
      },
    };

    if (can(user, "read:status:all")) {
      output.dependencies.database.version = resource.version;
    }

    return output;
  }
}

const authorization = {
  can,
  filterOutput,
};

export default authorization;
