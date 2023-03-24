// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import Scrollbars from 'react-custom-scrollbars';
import {FormattedMessage} from 'react-intl';
import classNames from 'classnames';
import {DragDropContext, Droppable, DroppableProvided, DropResult} from 'react-beautiful-dnd';
import {RouteComponentProps} from 'react-router-dom';
import {getHistory} from 'utils/browser_history';
import {Team} from '@mattermost/types/teams';

import Permissions from 'mattermost-redux/constants/permissions';

import {Constants} from 'utils/constants';
import {filterAndSortTeamsByDisplayName} from 'utils/team_utils';
import * as Utils from 'utils/utils';

import Pluggable from 'plugins/pluggable';

import {getCurrentProduct} from 'utils/products';
import SystemPermissionGate from 'components/permissions_gates/system_permission_gate';
import TeamButton from 'components/test/components/test_button';

import type {PropsFromRedux} from './index';
import team from 'components/admin_console/team_channel_settings/team';
import { isActive } from 'utils/filter_users';

export interface Props extends PropsFromRedux {
    location: RouteComponentProps['location'];
}

type State = {
    showOrder: boolean;
    teamsOrder: Team[];
}

export function renderView(props: Props) {
    return (
        <div
            {...props}
            className='scrollbar--view'
        />
    );
}

export function renderThumbHorizontal(props: Props) {
    return (
        <div
            {...props}
            className='scrollbar--horizontal'
        />
    );
}

export function renderThumbVertical(props: Props) {
    return (
        <div
            {...props}
            className='scrollbar--vertical'
        />
    );
}

export default class TeamSidebar extends React.PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            showOrder: false,
            teamsOrder: [],
        };
    }

    switchToPrevOrNextTeam = (e: KeyboardEvent, currentTeamId: string, teams: Team[]) => {
        if (Utils.isKeyPressed(e, Constants.KeyCodes.UP) || Utils.isKeyPressed(e, Constants.KeyCodes.DOWN)) {
            e.preventDefault();
            const delta = Utils.isKeyPressed(e, Constants.KeyCodes.DOWN) ? 1 : -1;
            const pos = teams.findIndex((team: Team) => team.id === currentTeamId);
            const newPos = pos + delta;

            let team;
            if (newPos === -1) {
                team = teams[teams.length - 1];
            } else if (newPos === teams.length) {
                team = teams[0];
            } else {
                team = teams[newPos];
            }

            this.props.actions.switchTeam(`/${team.name}`);
            return true;
        }
        return false;
    }

    switchToTeamByNumber = (e: KeyboardEvent, currentTeamId: string, teams: Team[]) => {
        const digits = [
            Constants.KeyCodes.ONE,
            Constants.KeyCodes.TWO,
            Constants.KeyCodes.THREE,
            Constants.KeyCodes.FOUR,
            Constants.KeyCodes.FIVE,
            Constants.KeyCodes.SIX,
            Constants.KeyCodes.SEVEN,
            Constants.KeyCodes.EIGHT,
            Constants.KeyCodes.NINE,
            Constants.KeyCodes.ZERO,
        ];

        for (const idx in digits) {
            if (Utils.isKeyPressed(e, digits[idx]) && parseInt(idx, 10) < teams.length) {
                e.preventDefault();

                // prevents reloading the current team, while still capturing the keyboard shortcut
                if (teams[idx].id === currentTeamId) {
                    return false;
                }
                const team = teams[idx];
                this.props.actions.switchTeam(`/${team.name}`);
                return true;
            }
        }
        return false;
    }

    handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.altKey) {
            const {currentTeamId} = this.props;
            const teams = filterAndSortTeamsByDisplayName(this.props.myTeams, this.props.locale, this.props.userTeamsOrderPreference);

            if (this.switchToPrevOrNextTeam(e, currentTeamId, teams)) {
                return;
            }

            if (this.switchToTeamByNumber(e, currentTeamId, teams)) {
                return;
            }

            this.setState({showOrder: true});
        }
    }

    handleKeyUp = (e: KeyboardEvent) => {
        if (!((e.ctrlKey || e.metaKey) && e.altKey)) {
            this.setState({showOrder: false});
        }
    }

    componentDidMount() {
        this.props.actions.getTeams(0, 200);
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
    }

    onDragEnd = (result: DropResult) => {
        const {
            updateTeamsOrderForUser,
        } = this.props.actions;

        if (!result.destination) {
            return;
        }

        const teams = filterAndSortTeamsByDisplayName(this.props.myTeams, this.props.locale, this.props.userTeamsOrderPreference);

        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;

        // Positioning the dropped Team button
        const popElement = (list: Team[], idx: number) => {
            return [...list.slice(0, idx), ...list.slice(idx + 1, list.length)];
        };

        const pushElement = (list: Team[], idx: number, itemId: string): Team[] => {
            return [
                ...list.slice(0, idx),
                teams.find((team) => team.id === itemId)!,
                ...list.slice(idx, list.length),
            ];
        };

        const newTeamsOrder = pushElement(
            popElement(teams, sourceIndex),
            destinationIndex,
            result.draggableId,
        );
        updateTeamsOrderForUser(newTeamsOrder.map((o: Team) => o.id));
        this.setState({teamsOrder: newTeamsOrder});
    }

    render() {
        if (!this.props.prevButton) {
            this.props.actions.setPreviousButton('chat');
        }
        console.log(this.props.prevButton);
        const root: Element | null = document.querySelector('#root');
        if (this.props.myTeams.length <= 1) {
            root!.classList.remove('multi-teams');
            return null;
        }
        root!.classList.add('multi-teams');

        const plugins = [];
        const currentTeam = this.props.currentTeam;
        
        const sortedTeams = filterAndSortTeamsByDisplayName(this.props.myTeams, this.props.locale, this.props.userTeamsOrderPreference);
        const currentProduct = getCurrentProduct(this.props.products, this.props.location.pathname);
        if (currentProduct && !currentProduct.showTeamSidebar) {
            return null;
        }

        const teamIcon = (
            <i
                className='fa fa-users'
                role={'img'}
                aria-label={Utils.localizeMessage('sidebar.team_menu.button.teamIcon', 'Team Icon')}
            />
        );

        const chatIcon = (
            <i
                className='fa fa-comments'
                role={'img'}
                aria-label={Utils.localizeMessage('sidebar.team_menu.button.chatIcon', 'Chat Icon')}
            />
        );

        const joinableTeams = [];

        joinableTeams.push(
            <TeamButton
                btnClass='team-btn__add'
                key='chat'
                btn='chat'
                url={`/`}
                active={this.props.prevButton === 'chat' ? true : false}
                tip={
                    <FormattedMessage
                        id='team_sidebar.join'
                        defaultMessage='Other teams you can join'
                    />
                }
                content={chatIcon}
                switchTeam={this.props.actions.switchTeam}
                setPreviousButton={this.props.actions.setPreviousButton}
            />
        );
        joinableTeams.push(
            <TeamButton
            btnClass='team-btn__add'
            key='more_teams'
            btn='team'
            url={currentTeam !== undefined ? `/${currentTeam.name}/select_team` : '/'}
            active={this.props.prevButton === 'team' ? true : false}
            tip={
                <FormattedMessage
                    id='team_sidebar.join'
                    defaultMessage='Other teams you can join'
                />
            }
            content={teamIcon}
            switchTeam={this.props.actions.switchTeam}
            setPreviousButton={this.props.actions.setPreviousButton}
            />
        );

        // Disable team sidebar pluggables in products until proper support can be provided.
        const isNonChannelsProduct = !currentProduct;
        if (isNonChannelsProduct) {
            plugins.push(
                <div
                    key='team-sidebar-bottom-plugin'
                    className='team-sidebar-bottom-plugin is-empty'
                >
                    <Pluggable pluggableName='BottomTeamSidebar'/>
                </div>,
            );
        }

        return (
            <div
                className={classNames('team-sidebar', {'move--right': this.props.isOpen})}
                role='navigation'
                aria-labelledby='teamSidebarWrapper'
            >
                <div
                    className='team-wrapper'
                    id='teamSidebarWrapper'
                >
                    <Scrollbars
                        autoHide={true}
                        autoHideTimeout={500}
                        autoHideDuration={500}
                        renderThumbHorizontal={renderThumbHorizontal}
                        renderThumbVertical={renderThumbVertical}
                        renderView={renderView}
                    >
                        <DragDropContext
                            onDragEnd={this.onDragEnd}
                        >
                            <Droppable
                                droppableId='my_teams'
                                type='TEAM_BUTTON'
                            >
                                {(provided: DroppableProvided) => {
                                    return (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                        >
                                            {/* {teams} */}
                                            {provided.placeholder}
                                        </div>
                                    );
                                }}
                            </Droppable>
                        </DragDropContext>
                        {joinableTeams}
                    </Scrollbars>
                </div>
                {plugins}
            </div>
        );
    }
}
