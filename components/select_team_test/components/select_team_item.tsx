// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {ReactNode, MouseEvent} from 'react';

// import LocalizedIcon from 'components/localized_icon';
// import OverlayTrigger from 'components/overlay_trigger';
// import Tooltip from 'components/tooltip';
// import TeamInfoIcon from 'components/widgets/icons/team_info_icon';

// import {t} from 'utils/i18n';
// import * as Utils from 'utils/utils';
import TeamIcon from '../../widgets/team_icon/team_icon';
import './select_team_item.scss'

type Props = {
    url: string;
    tip: string; 
    displayName?: string;
    teamIconUrl?: string | null;
    switchTeam: (url: string) => void;
    teamId?: string;
};

export default class SelectTeamItem extends React.PureComponent<Props> {
    
    render() {
        const icon = (
           <div className='team_icon_container'>
                <h2>{this.props.displayName  ? this.props.displayName.replace(/\s/g, '').substring(0, 2).toUpperCase( ) : '??'}</h2>
           </div> 
           
        );
        console.log(this.props)
        return (
            <div className='team_card'>
                {icon}
                <div className='team_name'>
                    <h4>{this.props.displayName}</h4>
                </div>
            </div>
        );
    }
}
