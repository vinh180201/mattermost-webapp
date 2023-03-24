// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {ReactNode, MouseEvent} from 'react';
// import {FormattedMessage} from 'react-intl';
// import {Link} from 'react-router-dom';

// import {Permissions} from 'mattermost-redux/constants';

import {CloudUsage} from '@mattermost/types/cloud';
import {Team} from '@mattermost/types/teams';
import * as Utils from 'utils/utils';
import {filterAndSortTeamsByDisplayName} from 'utils/team_utils';
import {GenericAction, GetStateFunc} from 'mattermost-redux/types/actions';
import {Dispatch} from 'redux';

import SelectTeamItem from './components/select_team_item';
import './select_team.scss'

export const TEAMS_PER_PAGE = 30;
const TEAM_MEMBERSHIP_DENIAL_ERROR_ID = 'api.team.add_members.user_denied';

type Actions = {
    getTeams: (page?: number, perPage?: number, includeTotalCount?: boolean) => any;
    loadRolesIfNeeded: (roles: Iterable<string>) => any;
    addUserToTeam: (teamId: string, userId?: string) => any;
    switchTeam: (url: string, team?: Team) => (dispatch: Dispatch<GenericAction>, getState: GetStateFunc) => void;

}

type Props = {
    currentUserId: string;
    currentUserRoles: string;
    currentUserIsGuest?: boolean;
    customDescriptionText?: string;
    isMemberOfTeam: boolean;
    listableTeams: Team[];
    siteName?: string;
    canCreateTeams: boolean;
    canManageSystem: boolean;
    canJoinPublicTeams: boolean;
    canJoinPrivateTeams: boolean;
    history?: any;
    siteURL?: string;
    totalTeamsCount: number;
    isCloud: boolean;
    isFreeTrial: boolean;
    usageDeltas: CloudUsage;
    myTeams: Team[];
    locale: string;
    userTeamsOrderPreference: string;
    actions: Actions;
};

type State = {
    loadingTeamId?: string;
    error: any;
    endofTeamsData: boolean;
    currentPage: number;
    currentListableTeams: Team[];
}

export default class SelectTeam extends React.PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);
    }

    render() : ReactNode {
        console.log(this.props)

        const sortedTeams = filterAndSortTeamsByDisplayName(this.props.myTeams, this.props.locale, this.props.userTeamsOrderPreference);

        const teams = sortedTeams.map((team: Team, index: number) => {
            return (
                <SelectTeamItem
                    key={'switch_team_' + team.name}
                    url={`/${team.name}`}
                    tip={team.display_name}
                    displayName={team.display_name}
                    teamIconUrl={Utils.imageURLForTeam(team)}
                    switchTeam={this.props.actions.switchTeam}
                    teamId={team.id}
                />
            );
        });

        return (
            <div id="ngu">
                <div className='team_list_header'>
                    <h3 className="teams-grid-title" id="teams-grid-title">Team</h3>

                </div>
                <div className='team_list'>
                    {teams}
                    {teams}
                    {teams}
                    {teams}
                </div>

            </div>
        )

    }
}
