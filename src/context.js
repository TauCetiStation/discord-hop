module.exports = {
    Discord: null,
    DiscrodGuildId: null,
    DiscordToken: null,
    
    VerifiedGroup: null,

    UsersTimeouts: {},
    UsersPending: {},

    ckey: function (name) {
        return name.replace(/[ .]/g, '').toLowerCase();
    }
};
